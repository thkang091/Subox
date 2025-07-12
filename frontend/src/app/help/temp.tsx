      <div className="max-w-4xl mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold mb-4 text-black">Help & Support</h1>
        <h2 className="text-xl font-bold mb-6 text-black">
          Contact Us
        </h2>

             {status.info.msg && (
        <div 
          className={`mb-4 p-4 rounded-lg flex items-start ${
            status.info.error ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'
          }`}
        >
          {status.info.error ? (
            <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
          ) : (
            <Check className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
          )}
          <span>{status.info.msg}</span>
        </div>
      )}

      <div className="space-y-4 px-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            Name
          </label>
          <input
            id="name"
            type="text"
            value={formData.name}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            placeholder="Write your name here"
            required
          />
        </div>
        
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            E-mail
          </label>
          <input
            id="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            placeholder="example@email.com"
            required
          />
        </div>
        
        <div>
          <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
            Title
          </label>
          <input
            id="subject"
            type="text"
            value={formData.subject}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            placeholder="Write the title of request here"
            required
          />
        </div>
        
        <div>
          <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
            Content
          </label>
          <textarea
            id="message"
            value={formData.message}
            onChange={handleChange}
            rows={4}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            placeholder="Write your request or question here"
            required
          />
        </div>
        
        <button
          onClick={handleSubmit}
          disabled={status.submitting || !isFormValid()}
          className={`w-full flex items-center justify-center px-6 py-3 rounded-md text-white font-medium transition-all duration-200 ${
            status.submitting || !isFormValid()
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-orange-500 hover:bg-orange-600 active:bg-orange-700'
          }`}
        >
          {status.submitting ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              sending...
            </>
          ) : (
            <>
              <Send className="w-5 h-5 mr-2" />
              Send
            </>
          )}
        </button>
      </div>
      
      <div className="mt-4 text-xs text-gray-500 mb-10 px-4">
        * You will get the answer within 5 days.
      </div>
