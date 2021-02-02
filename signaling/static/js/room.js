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
        isCameraOn: true,
        isVoiceOn: true,
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
        offer: function(data) {
            console.log('offer: ',data);
            this.createPeerConnection();
            this.peerConnection.setRemoteDescription(new RTCSessionDescription(data)).then(
                this.sendAnswer
            ).catch(error => {
                console.log('error send answer: ', error)
            });
        },
        answer: function(data) {
            console.log("answer: ",data);
            this.peerConnection.setRemoteDescription(new RTCSessionDescription(data));
        },
        candidate: function(data) {
            console.log("candidate: ",data);
            this.peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
        }
    },
    methods: {
        getLocalStream: async function() {
            console.log('get local stream');
            navigator.mediaDevices.getUserMedia({video: this.isCameraOn, audio: this.isVoiceOn})
            .then((stream) => {
                this.stream = stream;
                this.localStream = stream;
                this.$socket.connect();
            })
            .catch(error => {
                console.error('Cannot find stream - ', error);
            });
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
                this.setOfferLocalDescription
            ).catch(error => {
                console.error('Cannot Send offer - ', error);
            });
        },
        sendAnswer: function() {
            console.log('send answer');
            this.peerConnection.createAnswer().then(
                this.setAnswerLocalDescription
            ).catch(error => {
                console.error('Cannot Send answer - ', error);
            });
        },
        setOfferLocalDescription: function(sessionDesc)  {
            this.peerConnection.setLocalDescription(sessionDesc).then(
                this.$socket.emit('offer', sessionDesc)
            );
        },
        setAnswerLocalDescription: function(sessionDesc)  {
            this.peerConnection.setLocalDescription(sessionDesc).then(
                this.$socket.emit('answer', sessionDesc)
            );
        },
        onIceCandidate: function(event) {
            if(event.candidate) {
                console.log('ice candidate');
                this.$socket.emit('candidate', {
                    type: 'candidate',
                    candidate: event.candidate
                });
            }
        },
        onAddRemoteStream: function(event) {
            console.log('adding stream:', event.stream);
            this.remoteStream = event.stream;
        },
        onNegotiationNeeded: async function() {
            try {
                if (negotiating || this.peerConnection.signalingState != "stable") return;
                negotiating = true;
                /* Your async/await-using code goes here */
            } finally {
                negotiating = false;
            }
        },
        getUsername: async function(){
            var response = await fetch(apiEndpoint + 'user/get-username');
            var data = await response.json();
            this.username = data.username;
        },
        toggleCamera: function() {
            this.isCameraOn = !this.isCameraOn;
            this.localStream.getVideoTracks()[0].enabled = this.isCameraOn;
        },
        toggleVoice: function()  {
            this.isVoiceOn = !this.isVoiceOn;
            this.localStream.getAudioTracks()[0].enabled = this.isVoiceOn;
        },
    }
});