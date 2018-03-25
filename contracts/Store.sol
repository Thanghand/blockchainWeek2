pragma solidity ^0.4.18;

contract Store {

    // Declare Events: 
    event NotifyProduct(uint _id, string _name, string _category, string _imageLink, string _descLink, uint _price, ProductStatus _status, uint _quantity);
    event NotifyNewProduct(uint _id, string _name, string _category, string _imageLink, string _descLink, uint _price, ProductStatus _status, uint _quantity);
    event NotifyQuantityOfProduct(uint productId, uint quantity);
    event NotifyCreateEscrow(address buyer, address seller, uint price, uint productId);
    
    // Declare Enum
    enum ProductStatus {OPEN, CLOSE}

    // Declare variables 
    uint public productIndex;

    mapping(address => Product[]) public stores;
    mapping(uint => address) public productIdInStore;
    mapping(address => uint) public mappingEscrowWithProductId;

    address[] sellers;

    struct Product {
        uint id;
        string name;
        string category;
        string imageLink;
        string descLink;
        uint price;
        ProductStatus status;
        uint quantity;
    }

    function Store() public {
        productIndex = 0;
    }
    function mapEscrowToProductId(address _escrow, uint _productId) public {
        mappingEscrowWithProductId[_escrow] = _productId;
    }

    function addProduct(string _name, string _category, string _imageLink, string _descLink, uint _price, uint _quantity) public {
        isSellerExisted(msg.sender);
        productIndex += 1;
        Product memory product = Product(productIndex, _name, _category, _imageLink, _descLink, _price, ProductStatus.OPEN, _quantity);
        stores[msg.sender].push(product);
        productIdInStore[productIndex] = msg.sender;
        NotifyNewProduct(product.id, product.name, product.category, product.imageLink, product.descLink, product.price, product.status, product.quantity);
    }

    function buyProduct(uint _productId) payable public {
        decreaseQuantityProduct(_productId);
        // Create Escrow contract
        address seller = productIdInStore[_productId];
        NotifyCreateEscrow(msg.sender, seller, msg.value, _productId);
    }

    function mapEsrowToProduct(address _addressOfEscrow, uint _productId) public {
        mappingEscrowWithProductId[_addressOfEscrow] = _productId;
    }

    function transactionRejected(address escrow) public {
        uint productId = mappingEscrowWithProductId[escrow];
        if(productId != 0) {
            revertQuantityProduct(productId);
        }
        mappingEscrowWithProductId[escrow] = 0; // Remove Escrows
    }

    function getProductById(uint _productId) view public returns(uint id, string productName, string category, string imageLink, string descLink, uint price, ProductStatus status, uint quantity) {
        address seller = productIdInStore[_productId];
        for (uint i = 0 ; i < stores[seller].length; i++) {
            Product memory product = stores[seller][i];
            if (product.id == _productId) {
                return(product.id, product.name, product.category, product.imageLink, product.descLink, product.price, product.status, product.quantity);
            }
        }

        Product memory emptyProduct = Product(0, "", "", "", "", 0, ProductStatus.CLOSE, 0);
        return(emptyProduct.id, emptyProduct.name, emptyProduct.category, emptyProduct.imageLink, emptyProduct.descLink, emptyProduct.price, emptyProduct.status, emptyProduct.quantity);
    }

    function getProductsWithCategory(string _category) public returns(uint) {
        // TODO: If status is empty => set status is OPEN
        uint count = 0;
        if (sellers.length > 0) {
            for (uint i = 0 ; i < sellers.length; i ++) {
                address seller = sellers[i];
                for (uint j = 0; j < stores[seller].length; j ++) {
                    Product memory product = stores[seller][j];
                    if (keccak256(product.category) == keccak256(_category)) {
                        NotifyProduct(product.id, product.name, product.category, product.imageLink, product.descLink, product.price, product.status, product.quantity);
                        count += 1;
                    }
                }
            }
        }
        return count;
    }


    function updateProductQuantity(uint _productId, uint quantity) private {
        address seller = productIdInStore[_productId];
        for (uint i = 0 ; i < stores[seller].length; i++) {
            Product storage product = stores[seller][i];
            if (product.id == _productId) {
                product.quantity = quantity;
            }
        }
    }
    
    function decreaseQuantityProduct(uint _productId) private {
        var (id, name, category, imageLink, descLink, price, status, quantity) = getProductById(_productId);
        Product memory product = Product(id, name, category, imageLink, descLink, price, status, quantity);
        product.quantity -= 1;
        updateProductQuantity(product.id, product.quantity);
        NotifyQuantityOfProduct(product.id, product.quantity);
    }

    function revertQuantityProduct(uint _productId) private {
        var (id, name, category, imageLink, descLink, price, status, quantity) = getProductById(_productId);
        Product memory product = Product(id, name, category, imageLink, descLink, price, status, quantity);
        product.quantity += 1;
        updateProductQuantity(product.id, product.quantity);
        NotifyQuantityOfProduct(product.id, product.quantity);        
    }

    function getProductIndex() public view returns(uint) {
        return productIndex;
    }

    function isSellerExisted(address _seller) private returns(bool) {
        if (sellers.length == 0 ) {
            sellers.push(_seller);
            return false;
        } else {
            for (uint i = 0 ; i < sellers.length; i ++) {
                address seller = sellers[i];
                if (seller == _seller) {
                    return true;
                }
            }
            sellers.push(_seller);
        }
        return false;
    }
}