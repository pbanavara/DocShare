FROM node:alpine

RUN mkdir -p /usr/src
WORKDIR /usr/src/nextjs-blog

COPY . /usr/

RUN npm install
EXPOSE 3000
CMD npm run dev

