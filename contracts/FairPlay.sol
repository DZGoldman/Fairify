pragma solidity ^0.4.23;
pragma experimental ABIEncoderV2;
contract FairPlay {


    // timouts for dispute and for whole interaction for cashing out

struct ChainState {
    address merchant;
    address client;
    bytes32 merkelRoot;
    uint price;
    uint dataPacketsCount;
    // float?
    address contractAddress;
    uint256 timeout;
    uint cashOutDisputeNonce;
    string contentDisputeDataPacket;
}
ChainState cs;

  struct AppState {
    uint nonce;
    string dataPacket;

  }
event EnterStream(address client);
event ClientCashOut(uint nonce);

   constructor(bytes32 _merketRoot, uint _dataPacketsCount) payable{
        cs = ChainState({
            merchant: msg.sender,
            client: address(0),
            merkelRoot: _merketRoot,
            price: msg.value,
            dataPacketsCount:  _dataPacketsCount,
            timeout: 0,
            contractAddress: address(this),
            cashOutDisputeNonce: 0,
            contentDisputeDataPacket: ''
        });


   }

//   client enters contract
   function enter() payable public {
       require(msg.value == cs.price);
       cs.client = msg.sender;
       emit EnterStream(msg.sender);
   }

   function getChainStateData () public view returns(ChainState){
       return cs;
   }


//   convert any given app state to signable digest
   function stateToDigest(AppState appState) public view returns (bytes32){
        bytes32 inputAppHash = keccak256(abi.encode(appState));
        return keccak256(cs.contractAddress, inputAppHash);
   }

//   client starts a "claim" by trying to cash out (note that client has the right to claim w/ any appState)
   function clientInitCashOut(AppState appState) public {
       require(msg.sender == cs.client);
       cs.cashOutDisputeNonce = appState.nonce;
       cs.timeout = now + 3600;
       emit ClientCashOut(appState.nonce);
   }

    // clients claim was not disputed, can settle
      function clientClaimFunds() public {
          require(now > cs.timeout);
          require(cs.cashOutDisputeNonce > 0);
          settleWithNonce(cs.cashOutDisputeNonce);
      }

    // merchant punishes client for cashing out stale txn
    function disputeCashOut(AppState appState, bytes sig) public{
        require(now < cs.timeout);
        require(cs.cashOutDisputeNonce > 0);
        require(msg.sender == cs.merchant);
        bytes32 digest = stateToDigest(appState);
        require(recoverSigner(digest, sig) == counterPartyOf(msg.sender));
        if(appState.nonce > cs.cashOutDisputeNonce){
            // full punishment or naw?
            settleWithNonce(cs.dataPacketsCount);
        }
        // else give it to him?
   }


    // finalizes - merchant can  always cash out with client's signature
   function merchantCashOut(AppState appState, bytes sig) public {
       require(msg.sender == cs.merchant);
       if (appState.nonce == cs.dataPacketsCount){
           settleWithNonce(appState.nonce);
       } else {
            bytes32 digest = stateToDigest(appState);
            require(recoverSigner(digest, sig) == counterPartyOf(msg.sender));
            settleWithNonce(appState.nonce);
       }
   }
    // client requests merkel proof of content
     function disputeContent(AppState appState, bytes sig){
            require(msg.sender ==  cs.client);
            bytes32 digest = stateToDigest(appState);
            require(recoverSigner(digest, sig) == counterPartyOf(msg.sender));
            cs.contentDisputeDataPacket = appState.dataPacket;
            cs.timeout = now + 3600;
        }

// finalizes:
        // function merchantRespondDisputeContent
        // requrie within timeout
        // merkelproof
        // function merchantRespondDisputeContent()

        // require(now < timeout)

    function merchantDisputeResponse(
      bytes32[] _proof
    )
      public
    {
      require(now < cs.timeout);
      require(msg.sender == cs.merchant);

      require(bytes(cs.contentDisputeDataPacket).length!= 0);

      bool result = verify(_proof, cs.merkelRoot, keccak256(cs.contentDisputeDataPacket));

      if (result == true) {
        settleWithNonce(cs.dataPacketsCount);
      } else {
        settleWithNonce(0);
      }
    }

    function verify(
      bytes32[] proof,
      bytes32 root,
      bytes32 leaf
    )
      public
      pure
      returns (bool)
    {
      bytes32 computedHash = leaf;

      for (uint256 i = 0; i < proof.length; i++) {
        bytes32 proofElement = proof[i];

        if (computedHash < proofElement) {
          // Hash(current computed hash + current element of the proof)
          computedHash = keccak256(abi.encodePacked(computedHash, proofElement));
        } else {
          // Hash(current element of the proof + current computed hash)
          computedHash = keccak256(abi.encodePacked(proofElement, computedHash));
        }
      }

      // Check if the computed hash (root) is equal to the provided root
      return computedHash == root;
    }


// TODO: handle collatoral better
   function settleWithNonce(uint nonce) private {
       uint costPer = cs.price / cs.dataPacketsCount;
       cs.client.transfer(costPer * nonce);
       cs.merchant.transfer(address(this).balance);
   }




    function counterPartyOf(address user)public returns(address){
        if (user == cs.merchant){
            return cs.client;
        } else if (user== cs.client){
            return cs.merchant;
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
