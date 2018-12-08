import React, { Component } from "react";
import "./App.css";
import { ethers, utils } from "ethers";
import Merchant from './Merchant'
import Client from './Client'

window.utils = utils;
window.ethers = ethers;

class FairApp extends Component {


    componentDidMount = async  (then) =>{
      this.getChainStateData(async (data)=>{
        this.setState({
            merchant: data.merchant,
            merkelRoot: data.merkelRoot,
            price: data.price,
            dataPacketsCount: data.dataPacketsCount,
            balance: 0
        })
    })
    }
    getChainStateData = async (then) =>{
      const data = await this.props.guessContract.getChainStateData()
      then(data)
    }

  render() {
    return (
      <div className="App">
       {this.props.isMerchant ?  <Merchant
             sendMessage ={this.sendMessage}
             wallet={this.props.wallet}
             guessContract={this.props.guessContract}
             socket={this.props.socket}
             accounts={this.props.accounts}
             signingKey={this.props.signingKey}
             isMerchant={this.props.isMerchant}
             getChainStateData = {this.getChainStateData}
        
      />:       <Client
      sendMessage ={this.sendMessage}
      wallet={this.props.wallet}
      guessContract={this.props.guessContract}
      socket={this.props.socket}
      accounts={this.props.accounts}
      signingKey={this.props.signingKey}
      isMerchant={this.props.isMerchant}
      getChainStateData = {this.getChainStateData}
    />
      
      }
     


      </div>
    );
  }
}

export default FairApp;

