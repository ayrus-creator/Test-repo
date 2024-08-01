import React, { useState, useEffect, useContext } from 'react'

//INTERNAL IMPORT
import Style from '../styles/collection.module.css'
import images from '../img'
import {
  Banner,
  CollectionProfile,
  NFTCardTwo,
} from '../collectionPage/collectionIndex'
import { Slider, Brand } from '../components/componentsindex'
import Filter from '../components/Filter/Filter'
//IMPORT SMART CONTRACT DATA
import { NFTMarketplaceContext } from '../Context/NFTMarketplaceContext'

const Collection = () => {
  const collectionArray = [
    {
      image: images.nft_image_1,
    },
    {
      image: images.nft_image_2,
    },
    {
      image: images.nft_image_3,
    },
    {
      image: images.nft_image_1,
    },
    {
      image: images.nft_image_2,
    },
    {
      image: images.nft_image_3,
    },
    {
      image: images.nft_image_1,
    },
    {
      image: images.nft_image_2,
    },
  ]
  const { fetchMyNFTsOrListedNFTs, currentAccount } = useContext(
    NFTMarketplaceContext
  )

  const [nfts, setNfts] = useState([])
  const [myNFTs, setMyNFTs] = useState([])

  useEffect(() => {
    fetchMyNFTsOrListedNFTs('fetchItemsListed').then((items) => {
      setNfts(items)
    })
  }, [])

  useEffect(() => {
    fetchMyNFTsOrListedNFTs('fetchMyNFTs').then((items) => {
      setMyNFTs(items)
    })
  }, [])
  return (
    <div className={Style.collection}>
      <Banner bannerImage={images.creatorbackground1} />
      <CollectionProfile />
      <Filter />
      <NFTCardTwo NFTData={nfts} />
      <NFTCardTwo NFTData={myNFTs} />

      <Slider />
      <Brand />
    </div>
  )
}

export default Collection
