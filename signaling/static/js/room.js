var apiEndpoint = '/api_v1/';
var signalServerUrl = 'http://'+document.domain+':'+location.port+'/';
var roomId = $('#roomId').html();
var negotiating = false;
navigator.getUserMedia = navigator.getUserMedia ||
                         navigator.webkitGetUserMedia ||
                         navigator.mozGetUserMedia;
window.RTCPeerConnection = window.RTCPeerConnection ||
                           window.webkitRTCPeerConnection;


Vue.use(new VueSocketIO({
    debug: true,
    connection: signalServerUrl,
    vuex: {
      store,
      actionPrefix: "SOCKET_",
      mutationPrefix: "SOCKET_"
    },
    options: {autoConnect: false, transports: ['websocket']}
  })
);

var vm = new Vue({
    el: '#vm',
    delimiters: ['[[', ']]'],
    data: {
        stream: null,
        localStream: null,
        remoteStream: null,
        peerConnection: null,
        peerRemoteConnection: null,
        pcConfig: {},
        username: null,
    },
    created: async function() {
        this.getUsername()
            .then(() => {
                if(this.username) {
                    console.log('execute', this.username)
                    this.getLocalStream();
                }
            }
        );
    },
    sockets:{
        data: function(data) {
            console.log('Data received: ',data);
            this.handleSignalingData(data);
        },
        ready: async function(data) {
            console.log("Ready");
            await this.createPeerConnection();
            this.sendOffer();
        },
        connect: function() {
            console.log("Connected");
        },
        disconnect: function() {
            this.remoteStream = null;
        },
    },
    methods: {
        getLocalStream: async function() {
            console.log('get local stream');
            navigator.mediaDevices.getUserMedia({video: true, audio: true})
            .then((stream) => {
                this.stream = stream;
                this.localStream = stream;
                this.$socket.connect();
            })
            .catch(error => {
                console.error('Cannot find stream - ', error);
            });
        },
        sendData: function(data) {
            console.log('send data');
            this.$socket.emit('data', data);
        },
        handleSignalingData: function(data) {
            console.log('handling signal type - ', data.type);
            switch (data.type) {
                case 'offer':
                    this.createPeerConnection();
                    this.peerConnection.setRemoteDescription(new RTCSessionDescription(data)).then(
                        this.sendAnswer
                    ).catch(error => {
                        console.log('error send answer: ', error)
                    });
                    break;
                case 'answer':
                    console.log("answer: ",data);
                    this.peerConnection.setRemoteDescription(new RTCSessionDescription(data));
                  break;
                case 'candidate':
                  this.peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
                  break;
           }
        },
        createPeerConnection: function() {
            try {
                this.peerConnection = new RTCPeerConnection(this.pcConfig);
                this.peerConnection.onicecandidate = this.onIceCandidate;
                this.peerConnection.onaddstream = this.onAddRemoteStream;
                this.peerConnection.onnegotiationneeded = this.onNegotiationNeeded;
                console.log('stream di create peer', this.stream)
                this.peerConnection.addStream(this.stream);
                console.log('Peer Connection connected');
            } catch(error) {
                console.error('Failed to connect to Peer - ', error);
            }
        },
        sendOffer: function() {
            console.log('send offer');
            this.peerConnection.createOffer().then(
                this.setAndSendLocalDescription
            ).catch(error => {
                console.error('Cannot Send offer - ', error);
            });
        },
        sendAnswer: function() {
            console.log('send answer');
            this.peerConnection.createAnswer().then(
                this.setAndSendLocalDescription
            ).catch(error => {
                console.error('Cannot Send answer - ', error);
            });
        },
        setAndSendLocalDescription: function(sessionDesc) {
            console.log('set local description');
            this.peerConnection.setLocalDescription(sessionDesc).then(
                this.sendData(sessionDesc)
            );
        },
        onIceCandidate: function(event) {
            if(event.candidate) {
                console.log('ice candidate');
                this.sendData({
                    type: 'candidate',
                    candidate: event.candidate
                });
            }
        },
        onAddRemoteStream: function(event) {
            console.log('adding stream:', event.stream);
            this.remoteStream = event.stream;
        },
        getUsername: async function(){
            var response = await fetch(apiEndpoint + 'user/get-username');
            var data = await response.json();
            this.username = data.username;
        },
        onNegotiationNeeded: async function() {
            try {
                if (negotiating || this.peerConnection.signalingState != "stable") return;
                negotiating = true;
                /* Your async/await-using code goes here */
            } finally {
                negotiating = false;
            }
        }
    }
});