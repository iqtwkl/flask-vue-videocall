const apiEndpoint = '/api_v1/';
const signalServerUrl = 'http://'+document.domain+':'+location.port+'/room';
const roomId = $('#roomId').html();

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

const vm = new Vue({
    el: '#vm',
    delimiters: ['[[', ']]'],
    data: {
        localStream: '',
        peerConnection: '',
        remoteElem: $('.remoteStream'),
        localElem: $('.localStream'),
        pcConfig: {},
    },
    created: function() {
        this.getLocalStream();
    },
    sockets:{
        data: function(data) {
            console.log('Data received: ',data);
            this.handleSignalingData(data)
        },
        status: function() {
            console.log("Ready");
            this.createPeerConnection();
            this.sendOffer();
        },
        connect: function() {
            console.log("Connected");
        }
    },
    methods: {
        getLocalStream: function() {
            console.log('get local stream');
            navigator.mediaDevices.getUserMedia({video: true, audio: true})
            .then((stream) => {
                this.localStream = stream;
                this.$socket.connect();
                this.localElem.srcObject = stream;
                console.log('set local stream');
            })
            .catch(error => {
                console.error('Cannot find stream - ', error)
            });
        },
        sendData: function(data) {
            console.log('send data');
            this.$socket.emit('data', data)
        },
        handleSignalingData: function(data) {
            console.log('handling signal type - ', data.type);
            switch (data.type) {
                case 'offer':
                  this.createPeerConnection();
                  this.peerConnection.setRemoteDescription(new RTCSessionDescription(data));
                  this.sendAnswer();
                  break;
                case 'answer':
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
                this.peerConnection.onaddstream = this.onAddStream;
                this.peerConnection.addStream(this.localStream);
                console.log('Peer Connection connected');
            } catch(error) {
                console.error('Failed to connect to Peer - ', error)
            }
        },
        sendOffer: function() {
            console.log('send offer');
            this.peerConnection.createOffer().then(
                this.setAndSendLocalDescription
            ).catch(error => {
                console.error('Cannot Send offer - ', error)
            })
        },
        sendAnswer: function() {
            console.log('send answer');
            this.peerConnection.createAnswer().then(
                this.setAndSendLocalDescription
            ).catch(error => {
                console.error('Cannot Send answer - ', error)
            })
        },
        setAndSendLocalDescription: function(sessionDesc) {
            console.log('set local description')
            this.peerConnection.setLocalDescription(sessionDesc);
            this.sendData(sessionDesc);
        },
        onIceCandidate: function(event) {
            if(event.candidate) {
                console.log('ice candidate');
                sendData({
                    type: 'candidate',
                    candidate: event.candidate
                });
            }
        },
        onAddStream: function(event) {
            console.log('adding stream');
            this.remoteElem.srcObject = event.stream
        },
    }
});