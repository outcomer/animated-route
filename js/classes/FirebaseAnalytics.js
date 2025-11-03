import { initializeApp } from 'https://www.gstatic.com/firebasejs/11.0.2/firebase-app.js';
import { getDatabase, ref, get, runTransaction, onValue } from 'https://www.gstatic.com/firebasejs/11.0.2/firebase-database.js';

/**
 * Firebase Analytics helper for tracking animation statistics
 */
export class FirebaseAnalytics {
	/**
	 * Create a new FirebaseAnalytics instance
	 */
	constructor() {
		this.db = null;
		this.app = null;
		this.isInitialized = false;
	}

	/**
	 * Initialize Firebase with your project configuration
	 * @param {Object} config - Firebase configuration object
	 */
	init(config) {
		try {
			// Initialize Firebase
			this.app = initializeApp(config);
			this.db = getDatabase(this.app);

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
			const counterRef = ref(this.db, 'statistics/animationCount');

			// Use transaction to safely increment counter
			const result = await runTransaction(counterRef, (currentValue) => {
				return (currentValue || 0) + 1;
			});

			if (result.committed) {
				console.log('Animation count incremented to:', result.snapshot.val());
				return result.snapshot.val();
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
			const counterRef = ref(this.db, 'statistics/animationCount');
			const snapshot = await get(counterRef);
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
			const counterRef = ref(this.db, 'statistics/animationCount');
			onValue(counterRef, (snapshot) => {
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
			const logsRef = ref(this.db, 'logs/animations');
			const { push, serverTimestamp } = await import('https://www.gstatic.com/firebasejs/11.0.2/firebase-database.js');
			await push(logsRef, {
				timestamp: serverTimestamp(),
				event: 'animation_start',
				...metadata
			});
		} catch (error) {
			console.error('Error logging animation start:', error);
		}
	}
}
