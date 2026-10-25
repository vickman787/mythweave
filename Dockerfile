FROM node:24-bookworm-slim
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --include=dev --no-audit --no-fund
COPY index.html tsconfig.json vite.config.ts ./
COPY src ./src
COPY public ./public
COPY server ./server
RUN npm run build && mkdir -p /app/data && chown -R node:node /app/data
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3010
ENV DB_PATH=/app/data/mythweave.sqlite
USER node
EXPOSE 3010
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s CMD node -e "fetch('http://127.0.0.1:3010/health').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"
CMD ["npm", "start"]
