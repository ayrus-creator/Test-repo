import React, { useState, useEffect, useContext } from 'react'
import Wenb3Modal from 'web3modal'
import { ethers } from 'ethers'
import { useRouter } from 'next/router'
import axios from 'axios'
import { create as ipfsHttpClient } from 'ipfs-http-client'
//const client = ipfsHttpClient('https://ipfs.infura.io:5001/api/v0')
const projectId = '2OoVBB2xPCXD7gEl5w15ETrI58z'
const projectSecretKey = 'c8367b287031dc2c569df94178c93655'
const auth = `Basic ${Buffer.from(`${projectId}:${projectSecretKey}`).toString(
  'base64'
)}`
const subdomain = 'https://disha-saad-marketplace.infura-ipfs.io'
axios.defaults.headers['Content-Type'] = 'application/json;charset=utf-8'
axios.defaults.headers['Access-Control-Allow-Origin'] = '*'

const client = ipfsHttpClient({
  host: 'infura-ipfs.io',
  port: 5001,
  protocol: 'https',
  headers: {
    authorization: auth,
    crossorigin: true,
  },
})

//INTERNAL IMPORT
import { NFTMarketplaceAddress, NFTMarketplaceABI } from './constants'
//---FETCHING SMART CONTRACT
const fetchContract = (signerOrProvider) =>
  new ethers.Contract(
    NFTMarketplaceAddress,
    NFTMarketplaceABI,
    signerOrProvider
  )
//---CONNECTING WITH SMART CONTRACT

const connectingWithSmartContract = async () => {
  try {
    const web3Modal = new Wenb3Modal()
    const connection = await web3Modal.connect()
    const provider = new ethers.providers.Web3Provider(connection)
    const signer = provider.getSigner()
    const contract = fetchContract(signer)
    return contract
  } catch (error) {
    console.log('Something went wrong while connecting with contract', error)
  }
}
export const NFTMarketplaceContext = React.createContext()

export const NFTMarketplaceProvider = ({ children }) => {
  const titleData = 'Discover, collect, and sell NFTs'
  //------USESTAT
  const [error, setError] = useState('')
  const [openError, setOpenError] = useState(false)
  const [currentAccount, setCurrentAccount] = useState('')
  const [accountBalance, setAccountBalance] = useState('')
  const router = useRouter()
  const checkIfWalletConnected = async () => {
    try {
      if (!window.ethereum)
        return setOpenError(true), setError('Install MetaMask')

      const accounts = await window.ethereum.request({
        method: 'eth_accounts',
      })

      if (accounts.length) {
        setCurrentAccount(accounts[0])
        // console.log(accounts[0]);
      } else {
        setError('No Account Found')
        setOpenError(true)
      }

      // const provider = new ethers.providers.Web3Provider(window.ethereum)
      // const getBalance = await provider.getBalance(accounts[0])
      // const bal = ethers.utils.formatEther(getBalance)
      // setAccountBalance(bal)
    } catch (error) {
      setError('Something wrong while connecting to wallet')
      setOpenError(true)
    }
  }
  useEffect(() => {
    checkIfWalletConnected()
    connectingWithSmartContract()
  }, [])
  //---CONNET WALLET FUNCTION
  const connectWallet = async () => {
    try {
      if (!window.ethereum)
        return setOpenError(true), setError('Install MetaMask')

      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      })
      setCurrentAccount(accounts[0])
      // window.location.reload();
    } catch (error) {
      setError('Error while connecting to wallet')
      setOpenError(true)
    }
  }
  //---UPLOAD TO IPFS FUNCTION
  const uploadToIPFS = async (file) => {
    try {
      const added = await client.add({ content: file })
      const url = `${subdomain}/ipfs/${added.path}`
      return url
    } catch (error) {
      setError('Error Uploading to IPFS')
      setOpenError(true)
    }
  }
  //---CREATENFT FUNCTION
  const createNFT = async (name, price, image, description, router) => {
    if (!name || !description || !price || !image)
      return setError('Data Is Missing'), setOpenError(true)

    const data = JSON.stringify({ name, description, image })

    try {
      const added = await client.add(data)

      const url = `https://infura-ipfs.io/ipfs/${added.path}`

      await createSale(url, price)
      router.push('/searchPage')
    } catch (error) {
      setError('Error while creating NFT')
      setOpenError(true)
    }
  }
  //--- createSale FUNCTION
  const createSale = async (url, formInputPrice, isReselling, id) => {
    try {
      console.log(url, formInputPrice, isReselling, id)
      const price = ethers.utils.parseUnits(formInputPrice, 'ether')

      const contract = await connectingWithSmartContract()

      const listingPrice = await contract.getListingPrice()

      const transaction = !isReselling
        ? await contract.createToken(url, price, {
            value: listingPrice.toString(),
          })
        : await contract.resellToken(id, price, {
            value: listingPrice.toString(),
          })

      await transaction.wait()
      console.log(transaction)
    } catch (error) {
      setError('error while creating sale')
      setOpenError(true)
      console.log(error)
      provider.getCode(address)
    }
  }
  //--FETCHNFTS FUNCTION

  const fetchNFTs = async () => {
    try {
      const provider = new ethers.providers.JsonRpcProvider()

      const contract = fetchContract(provider)

      const data = await contract.fetchMarketItems()

      const items = await Promise.all(
        data.map(
          async ({ tokenId, seller, owner, price: unformattedPrice }) => {
            const tokenURI = await contract.tokenURI(tokenId)

            const {
              data: { image, name, description },
            } = await axios.get(tokenURI)
            const price = ethers.utils.formatUnits(
              unformattedPrice.toString(),
              'ether'
            )

            return {
              price,
              tokenId: tokenId.toNumber(),
              seller,
              owner,
              image,
              name,
              description,
              tokenURI,
            }
          }
        )
      )

      return items
    } catch (error) {
      setError('Error while fetching NFTS')
      setOpenError(true)
      console.log(error)
    }
  }

  useEffect(() => {
    if (currentAccount) {
      fetchNFTs()
    }
  }, [])
  //--FETCHING MY NFT OR LISTED NFTs
  const fetchMyNFTsOrListedNFTs = async (type) => {
    try {
      if (currentAccount) {
        const contract = await connectingWithSmartContract()

        const data =
          type == 'fetchItemsListed'
            ? await contract.fetchItemsListed()
            : await contract.fetchMyNFTs()

        const items = await Promise.all(
          data.map(
            async ({ tokenId, seller, owner, price: unformattedPrice }) => {
              const tokenURI = await contract.tokenURI(tokenId)
              const {
                data: { image, name, description },
              } = await axios.get(tokenURI)
              const price = ethers.utils.formatUnits(
                unformattedPrice.toString(),
                'ether'
              )

              return {
                price,
                tokenId: tokenId.toNumber(),
                seller,
                owner,
                image,
                name,
                description,
                tokenURI,
              }
            }
          )
        )
        return items
      }
    } catch (error) {
      setError('Error while fetching listed NFTs')
      setOpenError(true)
    }
  }

  useEffect(() => {
    fetchMyNFTsOrListedNFTs()
  }, [])

  //---BUY NFTs FUNCTION
  const buyNFT = async (nft) => {
    try {
      const contract = await connectingWithSmartContract()
      const price = ethers.utils.parseUnits(nft.price.toString(), 'ether')

      const transaction = await contract.createMarketSale(nft.tokenId, {
        value: price,
      })

      await transaction.wait()
      router.push('/author')
    } catch (error) {
      setError('Error While buying NFT')
      setOpenError(true)
    }
  }

  return (
    <NFTMarketplaceContext.Provider
      value={{
        titleData,
        connectWallet,
        uploadToIPFS,
        createNFT,
        createSale,
        fetchNFTs,
        fetchMyNFTsOrListedNFTs,
        checkIfWalletConnected,
        buyNFT,
        currentAccount,
        setOpenError,
        openError,
        error,
      }}
    >
      {children}
    </NFTMarketplaceContext.Provider>
  )
}
