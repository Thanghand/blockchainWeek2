var Store = artifacts.require("./Store.sol");

contract('Store', function(accounts) {
    it("Should add new product success", function() {
        var store;
        return Store.deployed()
        .then(function(instance){
            store = instance;
            return store.addProduct("Iphone X", "SMARTPHONE", "imageLink", "descLink", 100, 10);
        }).then(function(){
            return store.getProductIndex.call();     
        }).then(function(productId){
            return store.getProductById(productId);
        }).then(function(result){
            var productId = result[0].toNumber();
            assert.equal(1, productId, "Product id should have");  
        });
    });

    it("Should buy product success", function() {
        
    });

});
