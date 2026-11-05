class MockStorage implements Storage {
  private store: Record<string, string> = {}

  get length() {
    return Object.keys(this.store).length
  }

  clear() {
    this.store = {}
  }

  getItem(key: string) {
    return this.store[key] ?? null
  }

  key(index: number) {
    return Object.keys(this.store)[index] ?? null
  }

  removeItem(key: string) {
    delete this.store[key]
  }

  setItem(key: string, value: string) {
    this.store[key] = String(value)
  }
}

if (typeof globalThis.localStorage === "undefined") {
  globalThis.localStorage = new MockStorage()
}

if (typeof globalThis.sessionStorage === "undefined") {
  globalThis.sessionStorage = new MockStorage()
}

if (typeof globalThis.window === "undefined") {
  globalThis.window = globalThis as any
}
