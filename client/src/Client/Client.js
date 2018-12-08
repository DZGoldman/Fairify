import React, { Component } from "react";
import "./App.css";
import { ethers, utils } from "ethers";

import AudioWidget from './AudioWidget'

let dummyData = require('./DummyData.json')

window.utils = utils;
window.ethers = ethers;
const MerkleTree = require('merkletreejs')
const keccak256 = require('keccak256')
const buf2hex = x => '0x'+x.toString('hex')

class Client extends Component {
  state = {
    leavesAsHexes:[],
    merketRootVerified: false,
    hexLeavesSet: []
  }

  constructor(props) {
    super(props);
    this.audioWidgetRef = React.createRef();
    this.currentChunk = 0;
    this.totalChunks = 5;
  }

  componentDidMount = async () => {
      window.c = this;
    this.props.socket.on("message_data", this.handleIncomingMessage);
    this.setEvents()
    this.getNextChunk() // get first chunk
    this.timer = setInterval(()=> this.getNextChunk(), 1500);
  };

  setEvents = async () => {
    this.props.guessContract.on("*", data => {
        console.log("*** On Chain Event Event ***", data.event, "****");
        switch (data.event) {
          case "EnterStream":
            this.props.setParentState({client:data.args.client})
            break;
          case "Start":
            this.props.getAndSetData();
            break;
          case "Init":
          this.props.getAndSetData(()=>{
            this.props.sendMessage(   
               {
                 to:this.props.merchant, 
                from: this.props.client,
               type: 'readyToStart'
             });
          
        })
        break;
      }});
  }

  beEvil = async() => {
    this.props.guessContract.clientInitCashOut({nonce: 1, dataPacket: ''})
  }

  handleIncomingMessage = async msg => {
    if (msg.from == this.props.accounts[0]) {
      return false;
    }
    console.log("MESSAGE RECEIVED:", msg);
    switch (msg.data.type) {
      case "dataPacket":
        this.respondToDataPacket(msg)
        break;
      case "merkelLeaves":  
        this.handleMerkleLeaves(msg)
        break;

    }
  };

  handleMerkleLeaves =  async (msg) => {
    this.props.getAndSetData(()=>{
      var leaves = msg.data.leaves;
      leaves = leaves.map((leaf) => Buffer.from(leaf))
      const hexLeavesSet = new Set (leaves.map(buf2hex))
  
      const tree = new MerkleTree(leaves, keccak256)
      const root = buf2hex(tree.getRoot());
      if (root == this.props.chainData.merkelRoot){
        this.setState({merkelRootVerified: true, hexLeavesSet:hexLeavesSet})
      } else {
        console.warn('merkelization failed')
      }
    })
 
  }

  respondToDataPacket = async (msg)=> {
    // verify signature
    const data = msg.data;
    console.log('nonce', data.appState.nonce)
    const stateDigest = await this.props.guessContract.stateToDigest(data.appState);
    console.log('datatosingn',data.appState )
    let recovered = utils.recoverAddress(stateDigest, data.signature);
    if (recovered != this.props.chainData.merchant) {
      console.warn('invallid sig')
      return false;
    } 
    // verify data
    const dataPacket = data.appState.dataPacket;
    const packetAsHex = buf2hex(keccak256(dataPacket));
    if ( !this.state.hexLeavesSet.has(packetAsHex)
    //  || data.appState.nonce == 3 
    ){
      console.warn('INVALID CONTENT!')
      
      this.props.guessContract.disputeContent(data.appState, utils.joinSignature(data.signature))
      return

    }

    // send payment if not last
    const totalPackets = this.props.chainData.dataPacketsCount.toNumber();
    if (data.appState.nonce < totalPackets){
        
        const signature = this.props.signingKey.signDigest(stateDigest);
        // let recovered = utils.recoverAddress(stateDigest, signature);
        
        // if (recovered != this.props.client){
        //     console.warn('INVALID sig!!!', recovered, this.props.client)
        // }
        this.props.sendMessage({
            to:this.props.merchant, 
            from: this.props.client,
            appState: data.appState,
            signature,
            type: 'payment'
          })

    }

  }

  enter = async  () =>{
    this.props.guessContract.enter({value: this.props.chainData.price})
  }


  getNextChunk = () => {
    this.currentChunk += 1;
    if (this.currentChunk > this.totalChunks) {
      console.log(`Out of chunks at chunk #${this.currentChunk}, stopping polling`)
      clearInterval(this.timer)
      this.timer = null;
      return;
    }
    // call api here to fetch next chunk of data?
    console.log(`Retrieving chunk #${this.currentChunk} of ${this.totalChunks}`)
    
    let newData = dummyData[`pcm_data${this.currentChunk}`]
    this.feedNewData(newData)
  }
  feedNewData = (incomingAudioData) => {
    this.audioWidgetRef.current.handleNewData(incomingAudioData)
  }

  render() {
    return <div className="App">client app
    
    {this.state.merkelRootVerified &&
      <div>merkel root verified! ready to start
        <button onClick={this.enter}>start stream</button>
      </div>}
    <AudioWidget ref={this.audioWidgetRef}></AudioWidget>
    </div>;
  }
}

export default Client;
