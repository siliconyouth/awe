#!/usr/bin/env node

// Test script to demonstrate the setup command functionality
const { spawn } = require('child_process')
const path = require('path')

console.log('🎯 Testing AWE Setup Command...\n')

const cliPath = path.join(__dirname, 'apps/cli/dist/bin/awe.js')

// Run setup command with --no-ai flag and auto-exit after showing the interface
const setupProcess = spawn('node', [cliPath, 'setup', '--no-ai'], {
  stdio: 'pipe'
})

let output = ''

setupProcess.stdout.on('data', (data) => {
  const text = data.toString()
  process.stdout.write(text)
  output += text
  
  // Exit after showing the project type selection
  if (text.includes('What type of project is this?')) {
    setTimeout(() => {
      console.log('\n\n✅ Setup wizard is working! Exiting test...')
      setupProcess.kill()
    }, 1000)
  }
})

setupProcess.stderr.on('data', (data) => {
  process.stderr.write(data)
})

setupProcess.on('close', (code) => {
  console.log('\n📊 Test completed!')
  
  // Check if key features were displayed
  const features = [
    'AWE Interactive Setup Wizard',
    'Analyzing your project',
    'Project Summary',
    'Let\'s configure your setup'
  ]
  
  let passed = 0
  features.forEach(feature => {
    if (output.includes(feature)) {
      console.log(`✅ Found: "${feature}"`)
      passed++
    } else {
      console.log(`❌ Missing: "${feature}"`)
    }
  })
  
  console.log(`\n🎉 Passed ${passed}/${features.length} checks`)
})