import React, { Component } from 'react';
import logo from '../logo.png';
import './App.css';
import ERC20 from '../abis/ERC20.json'
import Web3 from 'web3'

class App extends Component {

//this function runs when the page loads up before the render
  async componentWillMount() {
    // Load Web3
    await this.loadWeb3()

    let web3 = new Web3('https://speedy-nodes-nyc.moralis.io/c1005db9c7232a9cdd7c64c1/bsc/mainnet')
    console.log('begin fetch')
 
    // Fetch internal transactions
    await fetch("https://api.bscscan.com/api?module=account&action=txlistinternal&address=0x151135ea49BB5B5Adeab15F19d9Dfb696C916c37&startblock=0&endblock=99999999&sort=dsc&apikey=3EECSDZ78CUE9JQDRJXBMGT8HKAMVZYQGF")
        .then(async response => {
            const data = await response.json();
            console.log('response completed data=', data)
            // check for error response
            if (!response.ok) {
                // get error message from body or default to response statusText
                const error = (data && data.message) || response.statusText;
                this.setState({
                isLoaded: true,
                error
                });
            }

            this.setState({
            transactions: data.result
            })

            console.log('data=', data)
        })
        .catch(error => {
            this.setState({
            isLoaded: true,
            error
            });

            console.error('There was an error!', error);
        });
    console.log('end fetch')
    //I need to loop through the transactions and convert the timestamp
    //or I need to just sum up all the data I need and show results for each coin

    for(var element in this.state.transactions) {
      //console.log('element.blockNumber = ', this.state.transactions[element].blockNumber);
      this.state.transactions[element].tDate = this.tsDate(this.state.transactions[element].timeStamp);
      //console.log('element.timeStamp = ', this.state.transactions[element].timeStamp);
      //console.log('element.tDate = ', this.state.transactions[element].tDate);
      var found = false;
      for(var reward in this.state.rewards) {
        if(this.state.rewards[reward].address == this.state.transactions[element].from){
          this.state.rewards[reward].amount += this.state.transactions[element].value/this.state.weiValue;
          this.state.rewards[reward].count ++;
          if (this.state.rewards[reward].lastRewardTS < this.state.transactions[element].timeStamp)
          {
            this.state.rewards[reward].lastRewardTS = this.state.transactions[element].timeStamp;
            this.state.rewards[reward].lastRewardDate = this.state.transactions[element].tDate;
          }
          found = true;
          break;
        }
      } 
      let tokenName;
      if (!found)
      {
        try {
          const contract = new web3.eth.Contract(ERC20.abi, this.state.transactions[element].from);
          tokenName = await contract.methods.name().call();
        } catch (error) {
          tokenName = 'Unknown';
          // expected output: ReferenceError: nonExistentFunction is not defined
          // Note - error messages will vary depending on browser
        }


        var reward = {
            'address': this.state.transactions[element].from,
            'token': tokenName,
            'count': 1,
            'amount': this.state.transactions[element].value/this.state.weiValue,
            'firstRewardTS': this.state.transactions[element].timeStamp,
            'firstRewardDate': this.state.transactions[element].tDate,
            'lastRewardTS': this.state.transactions[element].timeStamp,
            'lastRewardDate': this.state.transactions[element].tDate,
        }
        this.state.rewards.push(reward);
        console.log('Added Reward = ', this.state.transactions[element].from);
      }             
    }
    console.log('end rewards = ',this.state.rewards);
    //const contract = new web3.eth.Contract(ERC20.abi, '0x0952ddffde60786497c7ced1f49b4a14cf527f76');
    //const tokenName = await contract.methods.name().call();
    //console.log('tokenName = ', tokenName);
    this.setState({isLoaded: true})

  }

  async loadWeb3() {
    if (window.ethereum) {
      window.web3 = new Web3(window.ethereum)
      await window.ethereum.enable()
    }
    else if (window.web3) {
      window.web3 = new Web3(window.web3.currentProvider)
    }
    else {
      window.alert('Non-Ethereum browser detected. You should consider trying MetaMask!')
    }
    const accounts = await window.web3.eth.getAccounts()

    this.setState({
      weiValue: window.web3.utils.toWei('1', 'ether'),
      account: accounts[0]
    })

  }

  //create state object
  constructor(props) {
    super(props)
    this.state = {
      weiValue: 1000000000000000000,
      walletConnected: 'no',
      account: '',
      error: null,
      isLoaded: false,
      transactions: [],
      rewards: []
    }
  }

  tsDate(ts) {
    var date = new Date(ts*1000);
    return date.getFullYear() + "-" + (date.getMonth()+1) + "-" + date.getDate() + " " + date.getHours() + ":" + date.getMinutes();
  }
  render() {

    const { error, isLoaded, transactions } = this.state;
    if (error) {
      return <div>Error: {error.message}</div>;
    } else if (!isLoaded) {
      return <div>Loading...</div>;
    } else {
    return (
      <div>
        <nav className="navbar navbar-dark fixed-top bg-dark flex-md-nowrap p-0 shadow">
          <a
            className="navbar-brand col-sm-3 col-md-2 mr-0"
            href="http://marketwarlords.com"
            target="_blank"
            rel="noopener noreferrer"
          >
            Ghostface Rewards Tracker
          </a>
          <ul className="navbar-nav px-3">
            <li className="nav-item text-nowrap d-none d-sm-none d-sm-block">
              <small className="text-white"><span id="account">{this.state.account}</span></small>
            </li>
          </ul>          
        </nav>
        <div className="container-fluid mt-5">
          <div className="row">
            <main role="main" className="col-lg-12 d-flex text-center">
              <div className="content mr-auto ml-auto" style={{ width: '1000px' }}>
                <h5>Ghostface Rewards Tracker</h5>

                <div className="row">
                  <div className="col-lg-12 mt-3">

                    <div className="card">
                      <div className="card-header">
                        <h5>Latest Rewards</h5>
                      </div>
                      <div className="card-body">
                        <table className="table">
                          <thead>
                            <tr>
                              <th scope="col">Token</th>
                              <th scope="col">Rewards</th>
                              <th scope="col">BNB Amount</th>
                              <th scope="col">Last Reward Date</th>
                            </tr>
                          </thead>
                          <tbody>
                            { this.state.rewards.map((reward, key) => {
                              return (
                                <tr key={key} >
                                  <th scope="row">{reward.token}</th>
                                  <td>{reward.count}</td>
                                  <td>{reward.amount}</td>                                  
                                  <td>{reward.lastRewardDate}</td>
                                </tr>
                              )
                            }) }
                          </tbody>
                        </table>
                      </div>
                    </div>

                  </div>
                </div>



                <div className="row">
                  <div className="col-lg-12 mt-3">

                    <div className="card">
                      <div className="card-header">
                        <h5>Latest Transactions</h5>
                      </div>
                      <div className="card-body">
                        <table className="table">
                          <thead>
                            <tr>
                              <th scope="col">Block</th>
                              <th scope="col">Date</th>
                              <th scope="col">From</th>
                              <th scope="col">BNB Amount</th>
                            </tr>
                          </thead>
                          <tbody>
                            { this.state.transactions.map((transaction, key) => {
                              return (
                                <tr key={key} >
                                  <th scope="row">{transaction.blockNumber}</th>
                                  <td>{transaction.tDate}</td>                                  
                                  <td>{transaction.from.substring(0,50)}</td>
                                  <td>{transaction.value/this.state.weiValue}</td>
                                </tr>
                              )
                            }) }
                          </tbody>
                        </table>
                      </div>
                    </div>

                  </div>
                </div>

              </div>
            </main>
          </div>
        </div>
      </div>
    );
    }
  }
}

export default App;
