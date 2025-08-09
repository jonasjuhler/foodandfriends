import React from "react";

const Home: React.FC = () => {
  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="text-center space-y-6">
        <h1 className="text-4xl md:text-6xl font-bold text-white drop-shadow-lg">
          About Food & Friends
        </h1>
        <p className="text-xl md:text-2xl text-white/90 drop-shadow-md max-w-3xl mx-auto">
          Learn more about our annual food festival experience
        </p>
      </div>

      {/* Festival Info Cards */}
      <div className="grid grid-cols-1 max-w-md mx-auto gap-6 mt-12">
        <div className="bg-white/70 backdrop-blur-sm rounded-lg p-6 shadow-lg">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Location</h3>
          <p className="text-gray-700">
            Guldbergsgade 51A, 4. tv.
            <br />
            2200 København N
          </p>
        </div>

        <div className="bg-white/70 backdrop-blur-sm rounded-lg p-6 shadow-lg">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Capacity</h3>
          <p className="text-gray-700">
            6 tickets per day
            <br />
            Limited availability
          </p>
        </div>
      </div>

      {/* CTA Section */}
      <div className="text-center mt-12">
        <a
          href="/"
          className="inline-flex items-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-gray-800 hover:bg-gray-900 transition-colors"
        >
          Book Your Ticket
        </a>
      </div>
    </div>
  );
};

export default Home;
