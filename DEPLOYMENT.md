# Deployment Workflow

## Quick Start

```bash
# 1. Start development
npm run dev

# 2. Run all checks before committing
npm run check

# 3. Commit and push (automated)
./scripts/release.sh
```

## Pre-Deployment Checklist

### ✅ Daily Development Workflow

1. **Start the development server**
   ```bash
   npm run dev
   ```
   Opens at [http://localhost:3000](http://localhost:3000)

2. **Make your changes**
   - Edit code in `src/`
   - Test locally in the browser
   - Check that features work as expected

3. **Run pre-deploy checks**
   ```bash
   npm run check
   ```
   This runs:
   - ✅ **Lint**: ESLint checks for code quality
   - ✅ **TypeCheck**: TypeScript validation
   - ✅ **Build**: Next.js production build test

4. **If checks pass, release to production**
   ```bash
   ./scripts/release.sh
   ```
   This will:
   - Confirm checks passed
   - Show git status
   - Prompt for commit message
   - Stage, commit, and push to GitHub
   - Trigger Vercel auto-deployment

### 🚀 Deployment Flow

```
Local Changes → npm run check → ./scripts/release.sh → GitHub (main) → Vercel Deploy
```

**Important**: Vercel automatically deploys when you push to the `main` branch.

---

## Individual Commands Reference

### Development
```bash
npm run dev          # Start dev server (localhost:3000)
npm run build        # Test production build
npm run start        # Run production build locally
```

### Quality Checks
```bash
npm run lint         # Run ESLint
npm run typecheck    # Run TypeScript compiler check
npm run check        # Run ALL checks (lint + typecheck + build)
```

### Release
```bash
./scripts/release.sh # Automated: check → commit → push
```

---

## Environment Setup

### Required Environment Variables

Create a `.env.local` file (never commit this!):

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Add other secrets here
```

### Vercel Environment Variables

Set the same variables in your Vercel project settings:
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. Go to Settings → Environment Variables
4. Add all variables from `.env.local`

---

## Troubleshooting

### `npm run check` fails

**Problem**: Linting or TypeScript errors

**Solution**:
1. Read the error output carefully
2. Fix errors one by one
3. Run `npm run lint` to check progress
4. Run `npm run typecheck` for TypeScript issues
5. Run `npm run check` again

### `./scripts/release.sh` fails

**Problem**: Script not executable or checks failing

**Solutions**:
- Make script executable: `chmod +x scripts/release.sh`
- Fix code issues: `npm run check` and resolve errors
- Check git status: `git status`

### Vercel deployment fails

**Problem**: Build fails on Vercel

**Solutions**:
1. Check Vercel build logs
2. Verify environment variables are set
3. Test build locally: `npm run build`
4. Ensure `.gitignore` is correct

---

## Best Practices

### Before Every Commit
- ✅ Run `npm run check` locally
- ✅ Test features in browser
- ✅ Review changes: `git status`

### Commit Messages
Use clear, descriptive messages:
```
✅ Good: "feat: add CMR signature upload"
✅ Good: "fix: resolve address autocomplete bug"
❌ Bad: "update"
❌ Bad: "changes"
```

### Branch Strategy
- `main` → Production (auto-deploys to Vercel)
- Feature branches → Create PRs to `main`

---

## Quick Reference Card

| Task                    | Command                  |
|-------------------------|--------------------------|
| Start dev server        | `npm run dev`            |
| Run all checks          | `npm run check`          |
| Lint only               | `npm run lint`           |
| Type check only         | `npm run typecheck`      |
| Build only              | `npm run build`          |
| Release (auto)          | `./scripts/release.sh`   |
| Manual commit           | `git add . && git commit -m "msg" && git push` |

---

## Need Help?

- **Documentation**: [Next.js Docs](https://nextjs.org/docs)
- **Deployment**: [Vercel Docs](https://vercel.com/docs)
- **Supabase**: [Supabase Docs](https://supabase.com/docs)
