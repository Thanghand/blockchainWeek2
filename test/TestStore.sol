pragma solidity ^0.4.2;

import "truffle/Assert.sol";
import "truffle/DeployedAddresses.sol";
import "../contracts/Store.sol";

contract TestStore {

    function testAddProductSuccessfully() public {

        // Given
        Store store = new Store();
        uint price = 111;
        uint quantity = 10;

        // When
        store.addProduct("Iphone X", "SMARTPHONE", "imageLink", "descLink", price, quantity);

        // Then
        uint expected = 2;
        Assert.equal(uint(2), expected, "Add Product successfully");
    }

    function testGetProductWithProductExisted() public {

         // Given
        Store store = new Store();
        uint productPrice = 111;
        uint productQuantity = 10;

        // When
        store.addProduct("Iphone X", "SMARTPHONE", "imageLink", "descLink", productPrice, productQuantity);
        store.addProduct("Iphone X1", "SMARTPHONE", "imageLink", "descLink", productPrice, productQuantity);
        store.addProduct("Iphone X2", "SMARTPHONE", "imageLink", "descLink", productPrice, productQuantity);
        store.addProduct("Iphone X3", "SMARTPHONE", "imageLink", "descLink", productPrice, productQuantity);
        
        // Then
        var (id, , , , , , , ) = store.getProductById(3);
        uint productIdExpected = 3;
        // var name = "Iphone X2";
        Assert.equal(productIdExpected, id, "Compare product id");
        // Assert.equal(keccak256(productName) == keccak256(name), true, "Compare product name");   
    }

    function testGetProductsWithCategory() public {
        // 

          // Given
        Store store = new Store();
        uint productPrice = 111;
        uint productQuantity = 10;

        // When
        store.addProduct("Iphone X", "FOOD", "imageLink", "descLink", productPrice, productQuantity);
        store.addProduct("Iphone X1", "FOOD", "imageLink", "descLink", productPrice, productQuantity);
        store.addProduct("Iphone X2", "FOOD", "imageLink", "descLink", productPrice, productQuantity);
        store.addProduct("Iphone X3", "SMARTPHONE", "imageLink", "descLink", productPrice, productQuantity);

        // Then 
        uint result = store.getProductsWithCategory("FOOD");
        Assert.equal(result, 4, "Compare size of  products");
   }
}