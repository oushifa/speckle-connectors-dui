import type {
  IBinding,
  IBindingSharedEvents
} from '~/lib/bindings/definitions/IBinding'

export const IAccountBindingKey = 'accountsBinding'

export interface IAccountBinding extends IBinding<IAccountBindingEvents> {
  getAccounts: () => Promise<Account[]>
  addAccount: (accountId: string, account: Account) => Promise<void>
  removeAccount: (accountId: string) => Promise<void>
}

// An almost 1-1 mapping of what we need from the Core accounts class.
export type Account = {
  id: string
  isDefault: boolean
  token: string
  refreshToken: string
  serverInfo: {
    name: string
    url: string
    frontend2: boolean
  }
  userInfo: {
    id: string
    avatar: string
    email: string
    name: string
    commits: { totalCount: number }
    streams: { totalCount: number }
  }
}

export interface IAccountBindingEvents extends IBindingSharedEvents {}

export class MockedAccountBinding implements IAccountBinding {
  public availableMethodNames = ['getAccounts', 'addAccount', 'removeAccount']

  private getStoredAccounts(): Account[] {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const stored = localStorage.getItem('mock-accounts')
        if (stored) return JSON.parse(stored) as Account[]
      }
    } catch (e) {
      console.warn('Failed to load accounts from localStorage', e)
    }
    return []
  }

  private saveAccounts(accounts: Account[]) {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem('mock-accounts', JSON.stringify(accounts))
      }
    } catch (e) {
      console.warn('Failed to save accounts to localStorage', e)
    }
  }

  public async getAccounts() {
    const config = useRuntimeConfig()
    const accounts = this.getStoredAccounts()

    const token = config.public.speckleToken as string | undefined
    const url = config.public.speckleUrl as string | undefined

    if (token && token !== 'undefined' && url && url !== 'undefined') {
      const envAccount: Account = {
        id: 'env-account',
        isDefault: accounts.length === 0,
        token,
        refreshToken: '',
        serverInfo: {
          name: 'Env Server',
          url,
          frontend2: true
        },
        userInfo: {
          id: 'env-user',
          avatar: '',
          email: 'env@speckle.systems',
          name: 'Env User',
          commits: { totalCount: 0 },
          streams: { totalCount: 0 }
        }
      }
      if (!accounts.find((a) => a.id === 'env-account')) {
        accounts.unshift(envAccount)
      }
    }

    return await Promise.resolve(accounts)
  }

  public async addAccount(accountId: string, account: Account) {
    await Promise.resolve()
    const accounts = this.getStoredAccounts()
    const idx = accounts.findIndex((a) => a.id === accountId)
    if (idx !== -1) {
      accounts[idx] = account
    } else {
      accounts.push(account)
    }
    this.saveAccounts(accounts)
  }

  public async removeAccount(accountId: string) {
    await Promise.resolve()
    const accounts = this.getStoredAccounts().filter((a) => a.id !== accountId)
    this.saveAccounts(accounts)
  }

  public async showDevTools() {
    await console.log('No way dude')
  }

  public async openUrl(url: string) {
    await window.open(url)
  }

  public on() {
    return
  }
}
