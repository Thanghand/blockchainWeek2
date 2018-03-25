pragma solidity ^0.4.18;

contract Escrow {
    address buyer;
    address seller;
    uint createdAt;
    bool buyerApprove;
    bool sellerApprove;
    bool buyerReject;
    bool sellerReject;

    address escrow = msg.sender;
    
    function Escrow(address _buyer, address _seller) payable public{
        buyer = _buyer;
        seller = _seller;
        createdAt = now;
    }

    function accept(address _sender) public returns(bool) {
        if (_sender == buyer) {
            buyerApprove = true;
        } else {
            if (_sender == seller) {
                sellerApprove = true;
            }
        }

        if (buyerApprove && sellerApprove) {
            payFeeForEscrow();
            payOut();
            return true; 
        } else {
            return false;
        }
    } 

    function reject(address _sender) public returns(bool) {
        if (_sender == buyer) {
            buyerReject = true; 
        } else {
            if (_sender == seller) {
                sellerReject = true;
            }
        }

        if (buyerReject && sellerReject) {
            refund();
            return true;
        }  else {
            return false;
        }
    }

    function payFeeForEscrow() private returns (bool) {
        return escrow.send(this.balance / 100);
    }

    function payOut() private returns(bool) {
        return seller.send(this.balance);
    }

    function refund() private returns(bool) {
        return buyer.send(this.balance);
    }

    function releaseContract() public {
        selfdestruct(escrow);
    }
}

contract EscrowManager {
    event NotifyEscrowCreated(address newAddress, uint productId);
    event NotifyEscrowAccept(address escrowAddress, bool status);
    event NotifyEscrowReject(address escrowAddress, bool status);
    
    function EscrowManager() public {}

    function createEscrow(address _seller, uint _productId) payable public {
        address newAddress = address((new Escrow).value(msg.value)(msg.sender, _seller));
        NotifyEscrowCreated(newAddress, _productId);
    }

    function accept(address addressOfEscrow) public {
        Escrow escrow = Escrow(addressOfEscrow);
        NotifyEscrowAccept(addressOfEscrow, escrow.accept(msg.sender));
    }

    function reject(address addressOfEscrow) public {
        Escrow escrow = Escrow(addressOfEscrow);
        bool result = escrow.reject(msg.sender);
        if (escrow.reject(msg.sender)) {
            NotifyEscrowReject(addressOfEscrow, result);
            // escrow.releaseContract();
        } else {
            NotifyEscrowReject(addressOfEscrow, result);
        }
    }
}