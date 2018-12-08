import React, { Component } from "react";
import "./App.css";
import { ethers, utils } from "ethers";
import Merchant from './Merchant'
import Client from './Client'

window.utils = utils;
window.ethers = ethers;

class FairApp extends Component {
    state ={chainData: {}, balance: 0}

    componentDidMount = async  (then) =>{
      this.getChainStateData(async (data)=>{
        console.log('????', data)
        this.setState({
          chainData: {
            merchant: data.merchant,
            merkelRoot: data.merkelRoot,
            price: data.price,
            dataPacketsCount: data.dataPacketsCount,
        
        }        
      })
    })
    }
    getChainStateData = async (then) =>{
      const data = await this.props.guessContract.getChainStateData()
      then(data)
    }

    setParentState = (newState)=>{
      this.setState(newState)
    }
  render() {
    return (
      <div className="App">
       {this.props.isMerchant ?  <Merchant
             sendMessage ={this.props.sendMessage}
             wallet={this.props.wallet}
             guessContract={this.props.guessContract}
             socket={this.props.socket}
             accounts={this.props.accounts}
             signingKey={this.props.signingKey}
             isMerchant={this.props.isMerchant}
             getChainStateData = {this.getChainStateData}
             chainData = {this.state.chainData}
             balance={this.state.balance}
             setParentState={this.setParentState}
        
      />:       <Client
      sendMessage ={this.props.sendMessage}
      wallet={this.props.wallet}
      guessContract={this.props.guessContract}
      socket={this.props.socket}
      accounts={this.props.accounts}
      signingKey={this.props.signingKey}
      isMerchant={this.props.isMerchant}
      getChainStateData = {this.getChainStateData}
      chainData = {this.state.chainData}
      balance={this.state.balance}
      setParentState={this.setParentState}


    />
      
      }
     


      </div>
    );
  }
}

export default FairApp;

