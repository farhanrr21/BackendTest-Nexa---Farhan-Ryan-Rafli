# Use the official Node.js image based on Alpine
FROM node:16-alpine

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json (if available)
COPY package.json package-lock.json ./

# Install the dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Expose port 3000 (or whatever port your app is using)
EXPOSE 3000

# Run the app
CMD ["npm", "start"]