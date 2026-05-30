FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install --production

COPY . .

# Expose port (ensure it matches the backend port)
EXPOSE 5000

# Start command
CMD ["npm", "start"]
