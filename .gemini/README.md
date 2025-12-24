# Development Rules for React Native KLine Chart View

This directory contains development rules and guidelines for working on the `react-native-kline-view` library.

## Files Overview

### 1. `rules.md` - Core Development Rules

**Contains**:

- ✅ Architecture principles (Cross-platform, Threading, Type Safety, Config-driven)
- ✅ Code standards for JavaScript/TypeScript, Android, and iOS layers
- ✅ Data model rules (KLineEntity, Indicator fields)
- ✅ **Detailed configuration schemas** (targetList, drawList, configList)
- ✅ **Indicator configuration** (MA, BOLL, MACD, KDJ, RSI, WR)
- ✅ **Drawing tools configuration**
- ✅ **Display configuration** (colors, layout, typography)
- ✅ Performance best practices
- ✅ Event system guidelines
- ✅ Testing guidelines
- ✅ Common pitfalls to avoid
- ✅ Code review checklist

**When to use**:

- Starting any new feature or modification
- Code reviews
- Onboarding new developers
- Resolving architectural questions

### 2. `supplementary_rules.md` - Advanced Guidelines

**Contains**:

- ✅ Adapter pattern implementation details
- ✅ File structure guidelines
- ✅ Development workflow (adding features, indicators, drawing tools)
- ✅ Data transformation pipeline
- ✅ Debugging guidelines
- ✅ Version control guidelines
- ✅ Release checklist
- ✅ Future improvements roadmap

**When to use**:

- Implementing complex features
- Debugging issues
- Preparing releases
- Planning new capabilities

## Quick Start Guide

### For New Features

1. Read relevant sections in `rules.md` first
2. Follow the workflow in `supplementary_rules.md`
3. Use the code review checklist before committing

### For Bug Fixes

1. Check "Common Pitfalls" in `rules.md`
2. Use "Debugging Guidelines" in `supplementary_rules.md`
3. Verify fix works on both iOS and Android

### For Code Reviews

1. Use the "Code Review Checklist" in `rules.md`
2. Verify threading model is correct
3. Check cross-platform consistency

## Key Principles (TL;DR)

1. **Threading**: Always parse data on worker thread, update UI on main thread
2. **Type Safety**: Null checks + type validation + default values
3. **Cross-Platform**: Maintain API parity between iOS and Android
4. **Config-Driven**: Everything configurable from JavaScript
5. **Performance**: Profile with 1000+ candles before release

## Rules Summary

✅ **READY FOR DEVELOPMENT** - These rules cover:

### Architecture & Design

- [x] Cross-platform consistency patterns
- [x] Threading model for data processing
- [x] Type safety requirements
- [x] Config-driven design principles
- [x] Adapter pattern implementation

### Configuration

- [x] Complete configuration schema
- [x] Indicator parameters (MA, BOLL, MACD, KDJ, RSI, WR)
- [x] Drawing tools settings
- [x] Display and styling options
- [x] Color format specifications

### Development

- [x] File structure guidelines
- [x] Workflow for adding features
- [x] Workflow for adding indicators
- [x] Workflow for adding drawing tools
- [x] Data transformation pipeline

### Quality Assurance

- [x] Testing guidelines (unit, integration, performance)
- [x] Debugging procedures
- [x] Common pitfalls and solutions
- [x] Code review checklist
- [x] Release checklist

### Documentation

- [x] Commit message format
- [x] Branch naming conventions
- [x] Version control guidelines
- [x] Logging best practices

## What's Covered

✅ You can now develop:

- New indicators with custom calculations
- New drawing tools and interactions
- Configuration options for styling
- Command handling for new features
- Cross-platform features
- Performance optimizations
- Bug fixes with proper debugging

## Additional Resources

- See `../CODE_ANALYSIS.md` for detailed source code analysis
- See `../README.md` for library usage documentation
- See `../example/` for implementation examples

## Need Help?

If these rules don't cover your use case:

1. Check `CODE_ANALYSIS.md` for implementation details
2. Review existing code for patterns
3. Ask for clarification in PR reviews
4. Update these rules to include the new case

---

**Last Updated**: 2025-12-24  
**Maintained By**: Development Team
