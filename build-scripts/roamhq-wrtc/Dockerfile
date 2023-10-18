# Use Debian 12 as the base image
FROM debian:12 as builder

# Set the environment variables as specified in the build instructions
ENV SKIP_DOWNLOAD=true
ENV TARGET_ARCH=arm64
ENV DEBUG=true

# Install the prerequisites
RUN apt-get update && \
    apt-get install -y git cmake build-essential ninja-build gcc-10 clang curl python3 python3-pip && \
    rm -rf /var/lib/apt/lists/*

# Install Node.js 20 (Stable)
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y nodejs

# Clone the repository and switch to its directory
RUN git clone https://github.com/node-webrtc/node-webrtc.git
WORKDIR /node-webrtc

# Install the Node.js package and build the project
RUN npm install cmake-js -g
RUN npm install
RUN npm run build

# Run subsequent builds (not necessary, but kept for completeness)
RUN cmake --build build

# Run the tests
RUN npm test

# Keep the container open for inspection
CMD [ "bash" ]

