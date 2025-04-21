'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';

export default function NoAccessPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-tr from-gray-900 via-gray-800 to-gray-900 text-white">
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className="bg-gray-800 p-10 rounded-2xl shadow-2xl max-w-2xl text-center space-y-6"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.4, duration: 0.6 }}
        >
          <Image
            src="/no-access.svg" // You'll need to add this SVG to your /public folder
            alt="No Access"
            width={300}
            height={300}
            className="mx-auto"
          />
        </motion.div>

        <h1 className="text-4xl font-bold text-red-400">Permission Denied</h1>
        <p className="text-lg text-gray-300">
          You don’t have the required permission to access this page. If you believe this is an error,
          please contact the administrator.
        </p>

        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
        <Link
            href="/"
            className="inline-block bg-red-500 hover:bg-red-600 text-white font-semibold px-6 py-3 rounded-lg transition-all"
            >
            Go Back Home
        </Link>
        </motion.div>
      </motion.div>
    </div>
  );
}