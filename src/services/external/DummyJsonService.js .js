class ExternalApiService {
  constructor(baseURL, config = {}) {
    this.baseURL = baseURL;
    this.config = {
      timeout: 5000,
      headers: {
        Accept: 'application/json',
        'User-Agent': 'My-Portfolio-Backend/1.0',
        ...config.headers,
      },
      ...config,
    };
  }

  async _fetch(endpoint, params = {}) {
    const url = new URL(`${this.baseURL}/${endpoint}`);
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, value);
    });

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      const response = await fetch(url, {
        headers: this.config.headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status} - ${response.statusText}`);
      }
      return response.json();
    } catch (error) {
      console.error(`API call failed: ${endpoint}`, error);
      throw new Error(`External API error: ${error.message}`);
    }
  }

  async getProducts(params = {}) {
    return this._fetch('products', params);
  }
}

export default new ExternalApiService('https://dummyjson.com');
