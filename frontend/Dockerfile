FROM node:14 as builder

WORKDIR /app
COPY package.json yarn.lock ./
RUN yarn install --network-timeout 100000

COPY . .
RUN yarn build

FROM node:14-alpine as run

WORKDIR /app
COPY --from=builder /app/build ./build

RUN npm install -g serve

ENTRYPOINT ["serve", "-s", "build"]
