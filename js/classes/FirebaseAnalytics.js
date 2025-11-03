/**
 * Firebase Analytics helper for tracking animation statistics
 */
export class FirebaseAnalytics {
	/**
	 * Create a new FirebaseAnalytics instance
	 */
	constructor() {
		this.db = null;
		this.isInitialized = false;
	}

	/**
	 * Initialize Firebase with your project configuration
	 * @param {Object} config - Firebase configuration object
	 * @param {string} recaptchaSiteKey - reCAPTCHA v3 site key (optional)
	 */
	init(config, recaptchaSiteKey = null) {
		try {
			if (!window.firebase) {
				console.warn('Firebase SDK not loaded');
				return false;
			}

			// Initialize Firebase
			firebase.initializeApp(config);
			this.db = firebase.database();

			// Initialize App Check if reCAPTCHA key is provided
			if (recaptchaSiteKey && window.firebase.appCheck) {
				try {
					const appCheck = firebase.appCheck();

					// For development: enable debug mode
					if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
						self.FIREBASE_APPCHECK_DEBUG_TOKEN = true;
					}

					appCheck.activate(recaptchaSiteKey, true); // true = auto-refresh tokens
					console.log('Firebase App Check activated with reCAPTCHA v3');
				} catch (error) {
					console.warn('Failed to activate App Check:', error);
				}
			}

			this.isInitialized = true;
			console.log('Firebase initialized successfully');
			return true;
		} catch (error) {
			console.error('Error initializing Firebase:', error);
			return false;
		}
	}

	/**
	 * Increment animation counter and return new value
	 * @returns {Promise<number>} New counter value
	 */
	async incrementAnimationCount() {
		if (!this.isInitialized) {
			console.warn('Firebase not initialized');
			return null;
		}

		try {
			const counterRef = this.db.ref('statistics/animationCount');

			// Use transaction to safely increment counter
			const snapshot = await counterRef.transaction((currentValue) => {
				return (currentValue || 0) + 1;
			});

			if (snapshot.committed) {
				console.log('Animation count incremented to:', snapshot.snapshot.val());
				return snapshot.snapshot.val();
			}

			return null;
		} catch (error) {
			console.error('Error incrementing animation count:', error);
			return null;
		}
	}

	/**
	 * Get current animation count
	 * @returns {Promise<number>} Current counter value
	 */
	async getAnimationCount() {
		if (!this.isInitialized) {
			console.warn('Firebase not initialized');
			return 0;
		}

		try {
			const counterRef = this.db.ref('statistics/animationCount');
			const snapshot = await counterRef.once('value');
			return snapshot.val() || 0;
		} catch (error) {
			console.error('Error getting animation count:', error);
			return 0;
		}
	}

	/**
	 * Listen to real-time updates of animation count
	 * @param {Function} callback - Callback function that receives updated count
	 */
	onAnimationCountChange(callback) {
		if (!this.isInitialized) {
			console.warn('Firebase not initialized');
			return;
		}

		try {
			const counterRef = this.db.ref('statistics/animationCount');
			counterRef.on('value', (snapshot) => {
				const count = snapshot.val() || 0;
				callback(count);
			});
		} catch (error) {
			console.error('Error listening to animation count:', error);
		}
	}

	/**
	 * Log animation start event with metadata (optional)
	 * @param {Object} metadata - Optional metadata about the animation
	 */
	async logAnimationStart(metadata = {}) {
		if (!this.isInitialized) {
			return;
		}

		try {
			const logsRef = this.db.ref('logs/animations');
			await logsRef.push({
				timestamp: firebase.database.ServerValue.TIMESTAMP,
				event: 'animation_start',
				...metadata
			});
		} catch (error) {
			console.error('Error logging animation start:', error);
		}
	}
}
