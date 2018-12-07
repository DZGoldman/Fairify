pragma solidity ^0.4.23;
pragma experimental ABIEncoderV2;
contract FairPlay {

    address merchant;
    address client;
    bytes32 merkelRoot;
    uint price;
    uint dataPacketsCount;
    // float?
    address contractAddress;
    uint256  public timeout;
    bool cashOutDispute;
    bytes32 contentDispute;
    bool settled;

    // timouts for dispute and for whole interaction for cashing out
    


  struct AppState {
    uint clientBalance;
    uint merchantBalance;
    uint nonce;
    // content, not merkelleef
    bytes32 merkelLeaf;
    bool mutualClose;
    
  }
  
  AppState cashOutState; 
   constructor(bytes32 _merketRoot, uint _dataPacketsCount) payable{
        merkelRoot = _merketRoot;
        price = msg.value;
        merchant = msg.sender;
        dataPacketsCount = _dataPacketsCount;
        contractAddress = address(this);
        
   }
   
   function enter() payable public {
       require(msg.value == price);
       client = msg.sender;
   }
   
   function stateToDigest(AppState appState) public returns (bytes32){
        bytes32 inputAppHash = keccak256(abi.encode(appState));
        return keccak256(contractAddress, inputAppHash);
   }    
   
   function cashOut(AppState appState, bytes sig) payable public{
       require(!cashOutDispute );
    //   !contentDispute);
       bytes32 digest = stateToDigest(appState);
       require(recoverSigner(digest, sig) == counterPartyOf(msg.sender));
       cashOutState = appState;
       timeout = now + 3600;
   }
   
   function disputeContent(AppState appState, bytes sig){
       require(msg.sender == client);
       bytes32 digest = stateToDigest(appState);
       require(recoverSigner(digest, sig) == merchant);
       contentDispute = appState.merkelLeaf;
       
       appState.clientBalance = price * 2;
       appState.merchantBalance = 0;
       cashOutState = appState;
   }
   
//   respondDisputeContent()
   
   function disputeCashOut(AppState appState, bytes sig){
        // bunch of require not settleds everywhere
        require(cashOutDispute);
        bytes32 digest = stateToDigest(appState);
        require(recoverSigner(digest, sig) == counterPartyOf(msg.sender));
        if(appState.nonce > cashOutState.nonce){
            // full punishment or naw?
            cashOutState = appState;
            settled = true;
        }
   }
   
   function claimFunds() payable public {
       if (!settled){
           require(cashOutDispute);
        //   || contentDispute);
           require((now > timeout));
       }

       client.transfer(cashOutState.clientBalance);
       merchant.transfer(cashOutState.merchantBalance);
       
   }
   
    function counterPartyOf(address user)public returns(address){
        if (user == merchant){
            return client;
        } else if (user== client){
            return user;
        }
        require(false);
    }
     function splitSignature(bytes sig)
       public
        returns (uint8, bytes32, bytes32)
    {
        require(sig.length == 65);

        bytes32 r;
        bytes32 s;
        uint8 v;

        assembly {
            // first 32 bytes, after the length prefix
            r := mload(add(sig, 32))
            // second 32 bytes
            s := mload(add(sig, 64))
            // final byte (first byte of the next 32 bytes)
            v := byte(0, mload(add(sig, 96)))
        }

        return (v, r, s);
    }

    function recoverSigner (bytes32 message, bytes sig)
     public
        returns (address)
    {
        uint8 v;
        bytes32 r;
        bytes32 s;

        (v, r, s) = splitSignature(sig);

        return ecrecover(message, v, r, s);
    }
    
    
  
    
  

}