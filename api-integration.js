// Реальная API интеграция для получения данных токенов Solana
// ТОЛЬКО SolanaTracker API с настоящим ключом!

class TokenAPI {
    constructor(tokenAddress) {
        this.tokenAddress = tokenAddress;
        this.cache = new Map();
        this.cacheTimeout = 30000; // 30 секунд кэш
        this.apiKey = 'f5f05c86-db5e-4dd6-ad81-69895808d8ae'; // РЕАЛЬНЫЙ API КЛЮЧ
        this.baseUrl = 'https://data.solanatracker.io';
    }

    // Основной метод для получения данных токена ТОЛЬКО из SolanaTracker
    async getTokenData() {
        const cacheKey = `token_${this.tokenAddress}`;
        const cached = this.cache.get(cacheKey);
        
        if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
            console.log('📋 Using cached SolanaTracker data');
            return cached.data;
        }

        try {
            console.log('🔄 Fetching fresh data from SolanaTracker API...');
            
            // ТОЛЬКО SolanaTracker API с вашим ключом
            const data = await this.fetchFromSolanaTracker();
            
            // Кэшируем результат
            this.cache.set(cacheKey, {
                data: data,
                timestamp: Date.now()
            });
            
            console.log('✅ SolanaTracker data fetched successfully:', data);
            return data;
        } catch (error) {
            console.error('❌ SolanaTracker API failed:', error);
            throw new Error(`Unable to fetch data for token ${this.tokenAddress} from SolanaTracker. Error: ${error.message}`);
        }
    }

    // SolanaTracker API - ЕДИНСТВЕННЫЙ источник данных с РЕАЛЬНЫМ ключом
    async fetchFromSolanaTracker() {
        const url = `${this.baseUrl}/tokens/${this.tokenAddress}`;
        
        console.log(`🔄 Requesting: ${url}`);
        console.log(`🔑 Using API key: ${this.apiKey.substring(0, 8)}...`);
        
        const response = await fetch(url, {
            headers: {
                'x-api-key': this.apiKey,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error(`SolanaTracker API error: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        
        console.log('🔍 SolanaTracker RAW response:', {
            hasToken: !!data.token,
            tokenName: data.token?.name,
            tokenSymbol: data.token?.symbol,
            poolsCount: data.pools?.length || 0,
            holders: data.holders,
            hasEvents: !!data.events
        });
        
        if (!data.pools || data.pools.length === 0) {
            throw new Error('Token not found or no pools available on SolanaTracker');
        }
        
        const pool = data.pools[0]; // Основной пул
        console.log('🔍 Pool structure:', {
            hasPrice: !!pool.price,
            priceUsd: pool.price?.usd,
            hasMarketCap: !!pool.marketCap,
            marketCapUsd: pool.marketCap?.usd,
            hasTxns: !!pool.txns,
            txnsVolume: pool.txns?.volume,
            hasLiquidity: !!pool.liquidity,
            liquidityUsd: pool.liquidity?.usd
        });
        
        // Извлекаем данные по документации SolanaTracker
        const price = parseFloat(pool.price?.usd) || 0;
        const marketCap = parseFloat(pool.marketCap?.usd) || 0;
        const volume = parseFloat(pool.txns?.volume) || 0;
        const holders = parseInt(data.holders) || 0;
        const liquidity = parseFloat(pool.liquidity?.usd) || 0;
        const change24h = parseFloat(data.events?.['24h']?.priceChangePercentage) || 0;
        
        console.log(`🎯 FINAL SolanaTracker data:
        💰 Price: $${price}
        📊 Market Cap: $${marketCap}
        📈 Volume: $${volume}
        👥 Holders: ${holders}
        💧 Liquidity: $${liquidity}
        📉 Change 24h: ${change24h}%`);
        
        return {
            price: price,
            priceUsd: price,
            marketCap: marketCap,
            volume: volume,
            holders: holders,
            change24h: change24h,
            liquidity: liquidity,
            name: data.token?.name || 'Unknown Token',
            symbol: data.token?.symbol || 'UNKNOWN',
            source: 'SolanaTracker'
        };
    }

    // Подписка на обновления цены в реальном времени
    startPriceUpdates(callback, interval = 30000) {
        console.log(`🔄 Starting SolanaTracker price updates every ${interval/1000} seconds...`);
        return setInterval(async () => {
            try {
                const data = await this.getTokenData();
                callback(data);
            } catch (error) {
                console.error('SolanaTracker price update failed:', error);
            }
        }, interval);
    }

    // Остановка обновлений
    stopPriceUpdates(intervalId) {
        if (intervalId) {
            clearInterval(intervalId);
            console.log('🛑 Stopped SolanaTracker price updates');
        }
    }
}

// Экспорт для использования в основном скрипте
window.TokenAPI = TokenAPI;

console.log('🎯 TokenAPI loaded - ТОЛЬКО SolanaTracker с реальным ключом!'); 