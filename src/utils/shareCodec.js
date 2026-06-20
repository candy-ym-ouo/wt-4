import LZString from 'lz-string'

const SHARE_DATA_KEY = 'd'
const MAX_URL_LENGTH = 2000

export const encodeShareData = (data) => {
  try {
    const jsonStr = JSON.stringify(data)
    const compressed = LZString.compressToEncodedURIComponent(jsonStr)
    return compressed
  } catch (error) {
    console.error('编码分享数据失败:', error)
    return null
  }
}

export const decodeShareData = (encoded) => {
  try {
    const decompressed = LZString.decompressFromEncodedURIComponent(encoded)
    if (!decompressed) return null
    return JSON.parse(decompressed)
  } catch (error) {
    console.error('解码分享数据失败:', error)
    return null
  }
}

export const buildShareUrl = (data, baseUrl = null) => {
  const encoded = encodeShareData(data)
  if (!encoded) return null

  const base = baseUrl || `${window.location.origin}${window.location.pathname}#/share-story`
  const url = `${base}?${SHARE_DATA_KEY}=${encoded}`

  if (url.length > MAX_URL_LENGTH) {
    console.warn(`分享链接过长 (${url.length} 字符)，可能在某些浏览器中无法正常工作`)
  }

  return url
}

export const parseShareUrl = (url = window.location.href) => {
  try {
    const urlObj = new URL(url)
    const encoded = urlObj.searchParams.get(SHARE_DATA_KEY)
    if (!encoded) return null
    return decodeShareData(encoded)
  } catch (error) {
    try {
      const hashIndex = url.indexOf('#')
      if (hashIndex > -1) {
        const queryStart = url.indexOf('?', hashIndex)
        if (queryStart > -1) {
          const queryStr = url.substring(queryStart + 1)
          const params = new URLSearchParams(queryStr)
          const encoded = params.get(SHARE_DATA_KEY)
          if (encoded) return decodeShareData(encoded)
        }
      }
      return null
    } catch (e2) {
      console.error('解析分享链接失败:', e2)
      return null
    }
  }
}

export const getDataSizeInfo = (data) => {
  const jsonStr = JSON.stringify(data)
  const encoded = encodeShareData(data)
  return {
    originalSize: jsonStr.length,
    compressedSize: encoded ? encoded.length : 0,
    compressionRatio: encoded ? ((1 - encoded.length / jsonStr.length) * 100).toFixed(1) : 0
  }
}
