// Import the page's CSS. Webpack will know what to do with it.
import "../stylesheets/app.css";

// Import libraries we need.
import { default as Web3 } from 'web3';
import { default as contract } from 'truffle-contract'

// Import our contract artifacts and turn them into usable abstractions.
import escrowManager_artifacts from '../../build/contracts/EscrowManager.json';
import store_artifacts from '../../build/contracts/Store.json';

// MetaCoin is our usable abstraction, which we'll use through the code below.
var EscrowManager = contract(escrowManager_artifacts);
var Store = contract(store_artifacts);
// The following code is simple to show off interacting with your contracts.
// As your needs grow you will likely need to change its form and structure.
// For application bootstrapping, check out window.addEventListener below.
var accounts;
var account;
var products = [];
let storeInstance;
let escrowManagerInstance;
let escrowAddress = undefined;
let selectedCategory = "SMARTPHONE";
// Init users 
var buyerOne;
var sellerOne;
var user;
window.App = {
  start: async function () {
    var self = this;
    Store.setProvider(web3.currentProvider);
    EscrowManager.setProvider(web3.currentProvider);
    accounts = await web3.eth.getAccounts;
    web3.eth.getAccounts(function (err, accs) {
      if (err != null) {
        alert("There was an error fetching your accounts.");
        return;
      }

      if (accs.length == 0) {
        alert("Couldn't get any accounts! Make sure your Ethereum client is configured correctly.");
        return;
      }
      accounts = accs;
      initUsers(accounts);
      initEscrowManager();
      initStore();

    });
  },
  getProducts: function(category) {
    $('#product-list').html(``);
   
    if (user){
      var tx = { from: user.address, gas: 2000000 };
      selectedCategory = category;
      storeInstance.getProductsWithCategory(category, tx).then(function (length) {
        console.log("Length of product", length);
        products = [];
      });
    }
  },
  addNewProduct: function () {
    var tx = { from: user.address, gas: 2000000 };
    var productName = $('#product-name').val();
    var productCategory = $('#product-category').val();;
    var productDescription = $('#product-descriptions').val();;
    var productPrice = $('#product-price').val();
    var productQuantity= $('#product-quantity').val();
    var productImage = $('#product-image').val();
    storeInstance.addProduct(productName, productCategory, productImage, productDescription, web3.toWei(productPrice, "ether"), productQuantity, tx);
  },
  buyProduct: function (productId, price) {

    if (escrowAddress === undefined) {
      var tx = { from: user.address, value: web3.toWei(1, "ether"), gas: 3000000 };
      storeInstance.buyProduct(productId, tx);
    }
  },
  acceptEscrowFromBuyer: function () {
    console.log("acceptEscrowFromBuyer: ", escrowAddress);
    var tx = { from: user.address, gas: 2000000 };
    escrowManagerInstance.accept(escrowAddress, tx);
  },
  acceptEscrowFromSeller: function () {
    console.log("acceptEscrowFromSeller");
    var tx = { from: user.address, gas: 2000000 };
    escrowManagerInstance.accept(escrowAddress, tx);
  },
  rejectEscrowFromBuyer: function () {
    var tx = { from: user.address, gas: 2000000 };
    escrowManagerInstance.reject(escrowAddress, tx);
  },
  rejectEscrowFromSeller: function () {
    var tx = { from: user.address, gas: 2000000 };
    escrowManagerInstance.reject(escrowAddress, tx);
  },
  login: function () {

    var userName = $("#username").val();

    if (userName === "Thang") {
      $('#input-user').html(``);
      $('#user-profile').html(`
          <h3>Hello ${userName} (Buyer)</h3>
        `);
      user = buyerOne;
      App.getProducts(selectedCategory);
    } else {
      if (userName === "Nam") {
        
        $('#input-user').html(``);
        $('#user-profile').html(`
          <h3>Hello ${userName} (Seller)</h3>
          <div id="create-user">
          <input id="product-name" placeholder="Product Name"></input>
          <input id="product-image" placeholder="Product Image - For example : QmPQF4eDX7LbH6QADmZ3E4H7Cv8akHoBmZg4PN9ezKWn7y"></input>
          <input id="product-category" placeholder="Product Category"></input>
          <input id="product-descriptions" placeholder="Product description"></input>
          <input id="product-price" type="number" placeholder="price (Ehter)- For example: 1"></input>
          <input id="product-quantity" type="number" placeholder="quantity"></input>
          <br/>        
          <button id="start-escrow" onclick="App.addNewProduct()">Create New Product</button>
          </div>
        `);
        user = sellerOne;
      App.getProducts(selectedCategory);
      }
    }
    
  }
};

function initUsers(accounts) {
  buyerOne = {
    name: "Thang",
    isBuyer: true,
    address: accounts[0]
  }

  sellerOne = {
    name: "Nam",
    isBuyer: false,
    address: accounts[1]
  }
}

// EscrowManager 
async function initEscrowManager() {
  escrowManagerInstance = await EscrowManager.deployed();
  initWatchEventsOfEscrowManager();
}

function initWatchEventsOfEscrowManager() {
  var eventWatchNewEscrow = escrowManagerInstance.NotifyEscrowCreated(function (error, result) {
    var request = result.args;
    escrowAddress = request.newAddress;
    var tx = { from: user.address, gas: 2000000 };
    storeInstance.mapEscrowToProductId(request.newAddress, request.productId, tx);
    $('#escrow').html(``);
    $("#escrow-status").html(``);
    if (user.isBuyer) {
      $('#escrow').append(`
      <div>
        <h3>Buyer</h3>
        <button id="start-escrow" onclick="App.acceptEscrowFromBuyer()">Accept</button>
        <button id="start-escrow" onclick="App.rejectEscrowFromBuyer()">Reject</button>
      </div>`)
    } else {
      $('#escrow').append(`
      <div>
        <h3>Seller</h3>
        <button id="start-escrow" onclick="App.acceptEscrowFromSeller()">Accept</button>
        <button id="start-escrow" onclick="App.rejectEscrowFromSeller()">Reject</button>
      </div>
      `)
    }
  });

  var eventWatchEscrowAccept = escrowManagerInstance.NotifyEscrowAccept(function (error, result) {
    console.log("eventWatchEscrowAccept: ", result);
    if (result.args.status) {
      escrowAddress = undefined;
      $("#escrow").html(``);
      $("#escrow-status").append(`<p>Escrow success</p>`);
    } else {
      $("#escrow-status").append(`<p>Escrow accepted pending</p>`);
    }
  });

  var eventWatchEscrowReject = escrowManagerInstance.NotifyEscrowReject(function (error, result) {
    console.log("eventWatchEscrowReject: ", result);
    if (result.args.status && escrowAddress != undefined) {
      var tx = { from: user.address, gas: 2000000 };
      storeInstance.transactionRejected(result.args.escrowAddress, tx);
      escrowAddress = undefined;
      $("#escrow").html(``);
      $("#escrow-status").append(`<p>Escrow Rejected</p>`);
    } else {
      $("#escrow-status").append(`<p>Escrow Rejected pending</p>`);
    }
  });
}

// Store
async function initStore() {
  storeInstance = await Store.deployed();
  initWatchEventsOfStore();
}

function initWatchEventsOfStore() {

  var eventWatchNotifyNewProduct = storeInstance.NotifyNewProduct(function (error, product) {
    console.log("New product", product);
    if(selectedCategory === product.args._category){
      renderProducts(product.args);
    }
  
  });

  var eventWatchNotifyProduct = storeInstance.NotifyProduct(function (error, product) {
    console.log("Get products with filter category", product.args);
    if(!isProductExisted(products, product.args) && selectedCategory === product.args._category){
      products.push(product.args);
      renderProducts(product.args);
    }
   
  });

  var eventWatchNotifyCreateEscrow = storeInstance.NotifyCreateEscrow(function (error, result) {
    // Create Escrow here
    console.log("Create Escrow: ", result);
    var request = result.args;
    var tx = { from: request.buyer, value: request.price.toNumber(), gas: 2000000 };
    escrowManagerInstance.createEscrow(request.seller, request.productId, tx);
  });

  var eventWatchProductChangeQuantity = storeInstance.NotifyQuantityOfProduct(function (error, result) {
    $("#product-quantity-" + result.args.productId).html(`Quantity: ${result.args.quantity}`);
  });

}

function renderProducts(product) {
  $('#product-list').append(buildProduct(product));
}

function buildProduct(product) {
  if (user.isBuyer){
    return `
    <div class="col-md-4">
        <div class="card mb-4 box-shadow">
          <img class="card-img-top" 
          src="http://localhost:8080/ipfs/${product._imageLink}" style="height: 225px; width: 100%; display: block;">
          <div class="card-body">
            <h3 style="font-weight: bold; color: black;">${product._name}<h3>
            <p class="card-text">${product._descLink}</p>
            <small class="text-muted" 
              id="product-quantity-${product._id}">
              Quantity: ${product._quantity}
            </small>
            <div class="d-flex">
              <div class="btn-group">
                <button 
                  type="button" 
                  onclick="App.buyProduct(${product._id}, ${product._price})"
                  class="btn btn-sm btn-outline-secondary">Buy: ${product._price} Ether</button>
              </div>
              
            </div>
          </div>
        </div>
     </div>
    `
  } else {
    return `
    <div class="col-md-4">
    <div class="card mb-4 box-shadow">
      <img class="card-img-top" 
      src="http://localhost:8080/ipfs/${product._imageLink}" style="height: 225px; width: 100%; display: block;">
      <div class="card-body">
        <h3 style="font-weight: bold; color: black;">${product._name}<h3>
        <p class="card-text">${product._descLink}</p>
        <small class="text-muted" 
          id="product-quantity-${product._id}">
          Quantity: ${product._quantity}
        </small>
      </div>
    </div>
    </div>`
  }
  
}

window.addEventListener('load', function () {
  // Checking if Web3 has been injected by the browser (Mist/MetaMask)
  if (typeof web3 !== 'undefined') {
    console.warn("Using web3 detected from external source. If you find that your accounts don't appear or you have 0 MetaCoin, ensure you've configured that source properly. If using MetaMask, see the following link. Feel free to delete this warning. :) http://truffleframework.com/tutorials/truffle-and-metamask")
    // Use Mist/MetaMask's provider
    window.web3 = new Web3(web3.currentProvider);
  } else {
    console.warn("No web3 detected. Falling back to http://127.0.0.1:9545. You should remove this fallback when you deploy live, as it's inherently insecure. Consider switching to Metamask for development. More info here: http://truffleframework.com/tutorials/truffle-and-metamask");
    // fallback - use your fallback strategy (local node / hosted node + in-dapp id mgmt / fail)
    window.web3 = new Web3(new Web3.providers.HttpProvider("http://127.0.0.1:9545"));
  }

  App.start();
});

function isProductExisted(products, target){
    if (products.length == 0) return false;
    for (var i = 0 ; i < products.length; i++){
       var product = products[i];
       if (product._id.toNumber() === target._id.toNumber()){
          return true;
       }
    }
    return false;
}
