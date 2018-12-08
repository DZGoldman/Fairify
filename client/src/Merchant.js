import React, { Component } from "react";
import "./App.css";
import { ethers, utils } from "ethers";
// const MerkleProof = artifacts.require('MerkleProof')
const MerkleTree = require('merkletreejs')
const keccak256 = require('keccak256')
const buf2hex = x => '0x'+x.toString('hex')

window.utils = utils;
window.ethers = ethers;

class Merchant extends Component {

  state = {
    dataPackets: ['a', 'b', 'c', 'd', 'e', 'f' ,'g', 'h'],
    latestPayment: {},
    nonce: 0,
    appState: {nonce: 0}
  }
  componentDidMount = async () => {
    window.m = this
    this.props.socket.on("message_data", this.handleIncomingMessage);
    this.setEvents();
    this.initData()

  };
  initData = () =>{
    const leaves = this.state.dataPackets.map(x => keccak256(x)).sort(Buffer.compare)
    console.log('LEAVES', leaves)
    const tree = new MerkleTree(leaves,keccak256)
    const root = buf2hex(tree.getRoot());
    console.log('MERKLEROOT', root)
    this.props.sendMessage({
      to:this.props.client, 
      from: this.props.merchant,
      leaves,
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
  
        }
      });
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
      dataPacket: "some data" //TODO 
      // this.state.datapackets[newNonce]
    };

    this.setState({appState}, async ()=>{

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
    if (recovered != this.props.client) {
      console.warn('INVALID sig!!!', recovered, this.props.client)
      return false;
    } 
    this.sendDataPacket()
  }
  handleIncomingMessage = async msg => {
    if (msg.sender == this.props.accounts[0]) {
      return false;
    }
    switch (msg.data.type) {
      case "payment":
        this.handleIncomingPayment(msg.data)
        break;

    }
  };

  render() {
    return <div className="App">merchant app</div>;
  }
}

export default Merchant;
