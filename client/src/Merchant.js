import React, { Component } from "react";
import "./App.css";
import { ethers, utils } from "ethers";
// const MerkleProof = artifacts.require('MerkleProof')
const MerkleTree = require('merkletreejs')
const keccak256 = require('keccak256')
const buf2hex = x => '0x'+x.toString('hex')

const musicData = require('./DummyData.json').pcm_data.map(chunk => { return new Uint16Array(chunk) })

window.utils = utils;
window.ethers = ethers;
window.keccak256 = keccak256;

class Merchant extends Component {

  state = {
    dataPackets: [],
    latestPayment: {},
    appState: {nonce: -1},
    appStateSig: '',
    leaves: [],
    sampleData: ['a', 'b', 'c', 'd', 'e', 'f' ,'g', 'h'],
    musicData,
    textData:[]
  }
  componentDidMount = async () => {
    window.m = this
    this.props.socket.on("message_data", this.handleIncomingMessage);
    this.setEvents();
    // this.initData()

  };
  initData = async (index) =>{
    const data = [this.state.sampleData, this.state.musicData, this.state.textData][index];
    const leaves = data.map(x => keccak256(Buffer.from( x ).toString('hex'))).sort(Buffer.compare)
    const tree = new MerkleTree(leaves,keccak256)
    const root = buf2hex(tree.getRoot());
    await this.props.guessContract.init(root, leaves.length)
    this.setState({leaves, dataPackets: data})

    }

    sendLeaves(){
      this.props.sendMessage({
          to:this.props.client, 
          from: this.props.merchant,
          leaves: this.state.leaves,
          type: 'merkelLeaves'
        })
    }

  setEvents = async () => {
    this.props.guessContract.on("*", data => {
        console.log("*** On Chain Event Event ***", data.event, "****");
        switch (data.event) {
          case "EnterStream":
            this.initiateStream(data.args.client)
            break;
            case "ClientCashOut":
            this.handleClientCashOut(data.args.nonce);
            break;
            case "Init":
            // this.sendLeaves();
            break;
            
  
        }
      });
  }

  test =  async () =>{
    await this.props.guessContract.merchantClaimsAll()
  }

  handleClientCashOut(nonce){
    if(this.state.appState.nonce > nonce){
      console.log('slash')
      window.setTimeout(()=>{

        this.props.guessContract.disputeCashOut(this.state.appState,  utils.joinSignature(this.state.appStateSig))
      }, 1000)
    }
  }


  initiateStream = async (client) => {
    this.props.setParentState({client})
    this.sendDataPacket()
  }

  sendDataPacket = async () =>{
    const newNonce = this.state.appState.nonce +1
    if (newNonce >= this.props.chainData.dataPacketsCount.toNumber()){
      return
      console.warn('DONE!')
    }
    console.log('NONCE', newNonce)
    const appState = {
      nonce: newNonce,
      dataPacket: Buffer.from(this.state.dataPackets[newNonce]).toString('hex') //TODO 
      // this.state.datapackets[newNonce]
    };

    this.setState({appState}, async ()=>{

    console.log("appState", appState)
    const stateDigest = await this.props.guessContract.stateToDigest(appState)
    const signature = this.props.signingKey.signDigest(stateDigest);
    this.props.sendMessage({
      to:this.props.client, 
      from: this.props.merchant,
      appState,
      signature,
      type: 'dataPacket'
    })
    })
  }

  handleIncomingPayment = async (data) =>{
    const stateDigest = await this.props.guessContract.stateToDigest(data.appState);
    let recovered = utils.recoverAddress(stateDigest, data.signature);

    console.log("PAYMENT RECEIVED", recovered)
    if (recovered != this.props.client) {
      console.warn('INVALID sig!!!', recovered, this.props.client)
      return false;
    } 
    this.setState({appState: data.appState, appStateSig: data.signature}, ()=>{

      this.sendDataPacket()
    })
  }
  handleIncomingMessage = async msg => {
    if (msg.sender == this.props.accounts[0]) {
      return false;
    }
    switch (msg.data.type) {
      case "payment":
        this.handleIncomingPayment(msg.data)
        break;
        case "readyToStart":
        this.sendLeaves();
        break;

    }
  };

  render() {
    return <div className="App">
      <button onClick={()=>{this.initData(0)}}>init sample</button>
      <button  onClick={()=>{this.initData(1)}} >init audio</button>
      <button  onClick={()=>{this.initData(2) }} > init text </button>
    </div>
  }
}

export default Merchant;
