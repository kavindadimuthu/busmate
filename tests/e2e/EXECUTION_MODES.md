# E2E Test Execution Modes — Quick Reference

This guide describes the different ways to run the E2E test suite with varying levels of visibility and speed control.

---

## 🎯 Quick Command Reference

### Headless Mode (CI/Production)
**Use when:** Running in CI/CD, need fast execution, no need to see the browser
```bash
pnpm run e2e:docker               # Docker environment, headless, full speed
pnpm run e2e                      # Local dev environment, headless, full speed
```

### Headed Mode (Debugging & Development)
**Use when:** Want to watch tests run, debugging failures, developing new tests
```bash
pnpm run e2e:docker:headed        # Docker environment, visible browser, full speed
pnpm run e2e:headed               # Local dev environment, visible browser, full speed
```

### Slow Mode (Visual Clarity)
**Use when:** Need to clearly see each test action, presenting demos, training
```bash
pnpm run e2e:docker:slow          # Docker environment, visible browser, 500ms slowdown
```

### Debug Mode (Step-by-Step)
**Use when:** Deep debugging, need to pause execution, inspect page state
```bash
pnpm run e2e:docker:debug         # Docker environment, Playwright Inspector
pnpm run e2e:debug                # Local dev environment, Playwright Inspector
```

### UI Mode (Interactive Testing)
**Use when:** Exploring tests, time-travel debugging, running specific tests interactively
```bash
pnpm run e2e:docker:ui            # Docker environment, Playwright UI mode
pnpm run e2e:ui                   # Local dev environment, Playwright UI mode
```

---

## ⚙️ Advanced Configuration

### Custom Slowdown Speed

Control the delay between test actions using the `SLOW_MO` environment variable:

```bash
# Subtle slowdown (300ms) — tests are still relatively fast
SLOW_MO=300 pnpm run e2e:docker:headed

# Comfortable viewing speed (500ms) — recommended for demos
SLOW_MO=500 pnpm run e2e:docker:headed

# Slower pace (800ms) — easier to follow complex interactions
SLOW_MO=800 pnpm run e2e:docker:headed

# Very slow (1500ms) — step-by-step visual debugging
SLOW_MO=1500 pnpm run e2e:docker:headed
```

**Recommended SLOW_MO values:**
| Value | Speed | Best For |
|-------|-------|----------|
| `0` | Full speed | CI/CD, headless runs |
| `300` | Slightly slowed | Light debugging |
| `500` | Comfortable | Demos, watching tests |
| `800` | Slow | Following complex flows |
| `1000+` | Very slow | Detailed step debugging |

### Permanent Configuration

Edit `tests/e2e/.env` to set default values:

```bash
# Make headed mode the default
HEADED=true

# Set a default slowdown
SLOW_MO=500
```

These can be overridden on the command line:

```bash
# Override .env settings
HEADED=false pnpm run e2e:docker      # Force headless even if .env says HEADED=true
SLOW_MO=1000 pnpm run e2e:docker      # Override .env slowdown value
```

---

## 📋 Mode Comparison

| Mode | Visibility | Speed | Interactive | Best For |
|------|-----------|-------|-------------|----------|
| **Headless** | ❌ No browser | ⚡ Fast | ❌ No | CI/CD, quick feedback |
| **Headed** | ✅ Browser visible | ⚡ Fast | ❌ No | Watching tests, basic debugging |
| **Slow** | ✅ Browser visible | 🐢 Slowed (500ms) | ❌ No | Demos, following test flow |
| **Debug** | ✅ Browser visible | ⏸️ Paused | ✅ Yes | Deep debugging, breakpoints |
| **UI Mode** | ✅ Browser visible | ⏸️ Manual | ✅ Yes | Interactive testing, exploration |

---

## 🔧 Combining Multiple Options

You can combine environment variables for custom behavior:

```bash
# Headed mode with custom slowdown
HEADED=true SLOW_MO=800 pnpm run e2e:docker

# Headed mode against local dev environment
HEADED=true pnpm run e2e

# UI mode with Docker environment
pnpm run e2e:docker:ui
```

---

## 💡 Tips & Best Practices

### For Development
- Use **headed mode** (`e2e:docker:headed`) while writing new tests
- Use **slow mode** (`e2e:docker:slow`) when the test flows too fast to follow
- Use **UI mode** (`e2e:docker:ui`) for interactive exploration and debugging

### For Debugging Failures
1. Start with **headed mode** to see what's happening
2. Add `SLOW_MO=500` if things happen too fast
3. Use **debug mode** if you need to pause and inspect
4. Use **UI mode** for time-travel debugging of past runs

### For CI/CD
- Always use **headless mode** (default `e2e:docker`)
- Set `CI=true` environment variable (most CI systems do this automatically)
- This enables test retries and disables `test.only`

### For Demos & Training
- Use **slow mode** (`e2e:docker:slow`) with 500ms delay
- Or increase to `SLOW_MO=800` for clearer visibility
- Keep browser window visible (`HEADED=true`)

---

## 🐛 Troubleshooting

### Browser doesn't appear in headed mode
- Ensure `HEADED=true` is set
- Check that you're using `:headed` or `:slow` commands
- Verify Docker environment is running: `pnpm run e2e:env:check`

### Tests run too fast to see actions
- Increase `SLOW_MO` value: try `500`, `800`, or `1000`
- Use the convenience command: `pnpm run e2e:docker:slow`

### Tests run too slow
- Reduce `SLOW_MO` value or set to `0`
- Use headless mode for full speed: `pnpm run e2e:docker`
- Remove `SLOW_MO` from your `.env` file

### UI mode doesn't connect to Docker backend
- Ensure Docker environment is running: `pnpm run e2e:env:start`
- Verify environment health: `pnpm run e2e:env:check`
- Check that `API_URL=http://localhost:8081` in `.env`

---

## 📚 Related Documentation

- [Main E2E README](./README.md) — Complete test suite documentation
- [Playwright Config](./playwright.config.ts) — Full configuration file
- [Environment Variables](./.env.example) — All available configuration options
- [Playwright Documentation](https://playwright.dev/docs/intro) — Official Playwright docs
