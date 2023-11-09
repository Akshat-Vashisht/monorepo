FROM rust:1.68 as builder
WORKDIR /usr/src/backend
COPY . .
RUN cargo install --path .

FROM debian:bullseye-slim
RUN apt-get update && apt-get install -y libpq5 && apt-get install ca-certificates -y && rm -rf /var/lib/apt/lists/*
COPY --from=builder /usr/local/cargo/bin/backend /usr/local/bin/backend
CMD ["backend"]