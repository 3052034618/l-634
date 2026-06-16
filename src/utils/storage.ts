import Taro from '@tarojs/taro'

const PREFIX = 'finance_app_'

export const setStorage = <T>(key: string, value: T): Promise<void> => {
  return new Promise((resolve, reject) => {
    try {
      Taro.setStorage({
        key: PREFIX + key,
        data: value,
        success: () => resolve(),
        fail: (err) => {
          console.error('[Storage] setStorage failed:', err)
          reject(err)
        }
      })
    } catch (e) {
      console.error('[Storage] setStorage error:', e)
      reject(e)
    }
  })
}

export const getStorage = <T>(key: string, defaultValue?: T): Promise<T | undefined> => {
  return new Promise((resolve) => {
    try {
      Taro.getStorage({
        key: PREFIX + key,
        success: (res) => resolve(res.data as T),
        fail: () => resolve(defaultValue)
      })
    } catch (e) {
      console.error('[Storage] getStorage error:', e)
      resolve(defaultValue)
    }
  })
}

export const removeStorage = (key: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    try {
      Taro.removeStorage({
        key: PREFIX + key,
        success: () => resolve(),
        fail: (err) => reject(err)
      })
    } catch (e) {
      console.error('[Storage] removeStorage error:', e)
      reject(e)
    }
  })
}

export const setStorageSync = <T>(key: string, value: T): void => {
  try {
    Taro.setStorageSync(PREFIX + key, value)
  } catch (e) {
    console.error('[Storage] setStorageSync error:', e)
  }
}

export const getStorageSync = <T>(key: string, defaultValue?: T): T | undefined => {
  try {
    const data = Taro.getStorageSync(PREFIX + key)
    return data !== '' && data !== undefined && data !== null ? (data as T) : defaultValue
  } catch (e) {
    console.error('[Storage] getStorageSync error:', e)
    return defaultValue
  }
}
