FROM node:16-alpine

WORKDIR /usr/src/app

# 1) Copy package files & install dependencies
COPY package.json package-lock.json ./
RUN npm ci --only=production

# 2) Copy the rest of the source
COPY . .

EXPOSE 4000

CMD ["npm", "start"]