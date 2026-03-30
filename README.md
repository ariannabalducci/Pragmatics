# Praggymatics

## Initial Setup
- Run: 
```
docker run --name praggymatics-db -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=praggymatics -p 5432:5432 -d postgres
npm install next react react-dom
npx prisma generate
npx prisma db push
npx tsx prisma/seed.ts
```

- Launch the app:
```
npm run dev
```

## Troubleshooting

If something unexpectedly stops working, try the following:

- Delete `./.next`, `./node_modules`, and `package-lock.json`
- Run:

```
npm cache clear --force
npm install
npm audit fix
```

## Authors

- Zhu Zhenyu
- [Pedro Rafael Angélico Madureira](https://gitlab.com/up202108866)
- [Sofia Vieira Pinto](https://gitlab.com/SofiaViP)