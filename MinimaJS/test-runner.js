#!/usr/bin/env node

/**
 * MinimaJS Test Runner
 * 
 * Automated test script that:
 * 1. Starts the development server
 * 2. Runs automated tests
 * 3. Reports results
 * 4. Optionally opens browser for manual testing
 */

const http = require('http');
const { spawn } = require('child_process');
const path = require('path');

class TestRunner {
  constructor() {
    this.serverProcess = null;
    this.serverPort = 8080;
    this.serverHost = 'localhost';
    this.results = {
      serverTest: false,
      frameworkTests: [],
      todoTests: [],
      errors: []
    };
  }

  async run() {
    console.log('🧪 MinimaJS Test Runner Starting...\n');
    
    try {
      // Step 1: Start development server
      console.log('🚀 Starting development server...');
      await this.startServer();
      
      // Step 2: Wait for server to be ready
      console.log('⏳ Waiting for server to be ready...');
      await this.waitForServer();
      
      // Step 3: Test server endpoints
      console.log('🌐 Testing server endpoints...');
      await this.testServerEndpoints();
      
      // Step 4: Run basic framework tests
      console.log('🔧 Testing framework functionality...');
      await this.testFramework();
      
      // Step 5: Test todo app functionality  
      console.log('📝 Testing todo app...');
      await this.testTodoApp();
      
      // Step 6: Report results
      console.log('\n📊 Test Results Summary:');
      this.reportResults();
      
      // Step 7: Provide next steps
      this.provideNextSteps();
      
    } catch (error) {
      console.error('❌ Test runner failed:', error.message);
      this.results.errors.push(error.message);
    } finally {
      // Clean up
      if (this.serverProcess) {
        console.log('\n🛑 Stopping development server...');
        this.serverProcess.kill();
      }
    }
  }

  async startServer() {
    return new Promise((resolve, reject) => {
      try {
        this.serverProcess = spawn('node', ['src/start-dev.js'], {
          stdio: ['ignore', 'pipe', 'pipe'],
          cwd: process.cwd()
        });
        
        this.serverProcess.stdout.on('data', (data) => {
          const output = data.toString();
          if (output.includes('Server running at')) {
            console.log('✅ Development server started successfully');
            resolve();
          }
        });
        
        this.serverProcess.stderr.on('data', (data) => {
          const error = data.toString();
          console.error('Server error:', error);
        });
        
        this.serverProcess.on('error', (error) => {
          reject(new Error(`Failed to start server: ${error.message}`));
        });
        
        // Timeout after 10 seconds
        setTimeout(() => {
          reject(new Error('Server startup timeout'));
        }, 10000);
        
      } catch (error) {
        reject(error);
      }
    });
  }

  async waitForServer(maxRetries = 10) {
    for (let i = 0; i < maxRetries; i++) {
      try {
        await this.makeRequest('/health');
        console.log('✅ Server is ready');
        return;
      } catch (error) {
        console.log(`⏳ Waiting for server... (${i + 1}/${maxRetries})`);
        await this.sleep(1000);
      }
    }
    throw new Error('Server failed to become ready');
  }

  async testServerEndpoints() {
    const endpoints = [
      { path: '/', description: 'Root endpoint' },
      { path: '/health', description: 'Health check' },
      { path: '/examples/index.html', description: 'Basic examples' },
      { path: '/examples/todo-app.html', description: 'Todo app' },
      { path: '/examples/components-demo.html', description: 'Component showcase' },
      { path: '/src/minima.js', description: 'Framework core' },
      { path: '/src/minima.dev.js', description: 'Dev tools' },
      { path: '/tests/framework-tests.html', description: 'Framework tests' },
      { path: '/tests/todo-app-test.html', description: 'Todo app tests' }
    ];

    for (const endpoint of endpoints) {
      try {
        const response = await this.makeRequest(endpoint.path);
        if (response.statusCode === 200) {
          console.log(`✅ ${endpoint.description}: OK`);
          this.results.frameworkTests.push({ name: endpoint.description, passed: true });
        } else {
          console.log(`❌ ${endpoint.description}: ${response.statusCode}`);
          this.results.frameworkTests.push({ 
            name: endpoint.description, 
            passed: false, 
            error: `HTTP ${response.statusCode}` 
          });
        }
      } catch (error) {
        console.log(`❌ ${endpoint.description}: ${error.message}`);
        this.results.frameworkTests.push({ 
          name: endpoint.description, 
          passed: false, 
          error: error.message 
        });
      }
    }
    
    this.results.serverTest = true;
  }

  async testFramework() {
    // These are basic smoke tests - the real tests run in the browser
    const tests = [
      {
        name: 'Core files exist',
        test: () => {
          const fs = require('fs');
          const files = ['src/minima.js', 'src/minima.dev.js', 'src/start-dev.js'];
          return files.every(file => fs.existsSync(file));
        }
      },
      {
        name: 'Package.json is valid',
        test: () => {
          const fs = require('fs');
          if (!fs.existsSync('package.json')) return false;
          try {
            const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
            return pkg.name === 'minimajs' && pkg.scripts && pkg.scripts.dev;
          } catch {
            return false;
          }
        }
      },
      {
        name: 'Example files exist',
        test: () => {
          const fs = require('fs');
          const files = [
            'examples/index.html',
            'examples/todo-app.html', 
            'examples/components-demo.html'
          ];
          return files.every(file => fs.existsSync(file));
        }
      },
      {
        name: 'Test files exist',
        test: () => {
          const fs = require('fs');
          const files = [
            'tests/framework-tests.html',
            'tests/todo-app-test.html'
          ];
          return files.every(file => fs.existsSync(file));
        }
      }
    ];

    for (const test of tests) {
      try {
        const passed = test.test();
        console.log(`${passed ? '✅' : '❌'} ${test.name}`);
        this.results.frameworkTests.push({ name: test.name, passed });
      } catch (error) {
        console.log(`❌ ${test.name}: ${error.message}`);
        this.results.frameworkTests.push({ 
          name: test.name, 
          passed: false, 
          error: error.message 
        });
      }
    }
  }

  async testTodoApp() {
    // Test that todo app files are accessible and contain expected content
    try {
      const response = await this.makeRequest('/examples/todo-app.html');
      const content = response.body;
      
      const checks = [
        { name: 'Contains MinimaJS script tags', test: content.includes('src="../src/minima.js"') },
        { name: 'Contains todo store definition', test: content.includes('todoStore') },
        { name: 'Contains router setup', test: content.includes('MinimaJS.router.init') },
        { name: 'Contains component definitions', test: content.includes('MinimaJS.defineComponent') },
        { name: 'Has navigation structure', test: content.includes('nav-all') && content.includes('nav-active') },
        { name: 'Has todo functionality', test: content.includes('addTodo') && content.includes('toggleTodo') }
      ];
      
      for (const check of checks) {
        console.log(`${check.test ? '✅' : '❌'} Todo App - ${check.name}`);
        this.results.todoTests.push({ name: check.name, passed: check.test });
      }
      
    } catch (error) {
      console.log(`❌ Todo App accessibility test failed: ${error.message}`);
      this.results.todoTests.push({ 
        name: 'Todo App accessibility', 
        passed: false, 
        error: error.message 
      });
    }
  }

  reportResults() {
    const frameworkPassed = this.results.frameworkTests.filter(t => t.passed).length;
    const frameworkTotal = this.results.frameworkTests.length;
    const todoPassed = this.results.todoTests.filter(t => t.passed).length;
    const todoTotal = this.results.todoTests.length;
    
    console.log(`\n📈 Framework Tests: ${frameworkPassed}/${frameworkTotal} passed`);
    console.log(`📈 Todo App Tests: ${todoPassed}/${todoTotal} passed`);
    console.log(`🌐 Server: ${this.results.serverTest ? 'Running' : 'Failed'}`);
    
    if (this.results.errors.length > 0) {
      console.log(`\n❌ Errors encountered:`);
      this.results.errors.forEach(error => console.log(`   - ${error}`));
    }
    
    const totalPassed = frameworkPassed + todoPassed;
    const totalTests = frameworkTotal + todoTotal;
    const successRate = totalTests > 0 ? Math.round((totalPassed / totalTests) * 100) : 0;
    
    console.log(`\n🎯 Overall Success Rate: ${successRate}% (${totalPassed}/${totalTests})`);
    
    if (successRate >= 90) {
      console.log('🎉 Excellent! MinimaJS is working great!');
    } else if (successRate >= 75) {
      console.log('👍 Good! Minor issues detected.');
    } else {
      console.log('⚠️  Issues detected. Check failed tests above.');
    }
  }

  provideNextSteps() {
    console.log('\n🔥 Next Steps:');
    console.log(`   1. Open http://${this.serverHost}:${this.serverPort}/examples/todo-app.html`);
    console.log(`   2. Open http://${this.serverHost}:${this.serverPort}/tests/framework-tests.html`);
    console.log(`   3. Open http://${this.serverHost}:${this.serverPort}/tests/todo-app-test.html`);
    console.log('   4. Test hot reload by editing files in examples/');
    console.log('   5. Check browser console for detailed test results');
    
    console.log('\n🛠️  Manual Testing:');
    console.log('   - Add/remove/edit todos');
    console.log('   - Switch between All/Active/Completed views'); 
    console.log('   - Test routing navigation');
    console.log('   - Verify hot reload functionality');
    
    if (this.serverProcess && !this.serverProcess.killed) {
      console.log('\n💡 The development server will continue running...');
      console.log('   Press Ctrl+C to stop the server when done testing');
    }
  }

  async makeRequest(path) {
    return new Promise((resolve, reject) => {
      const options = {
        hostname: this.serverHost,
        port: this.serverPort,
        path: path,
        method: 'GET'
      };

      const req = http.request(options, (res) => {
        let body = '';
        res.on('data', (chunk) => {
          body += chunk;
        });
        res.on('end', () => {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: body
          });
        });
      });

      req.on('error', (error) => {
        reject(error);
      });

      req.setTimeout(5000, () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });

      req.end();
    });
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Run the tests if this script is executed directly
if (require.main === module) {
  const runner = new TestRunner();
  runner.run().catch(error => {
    console.error('💥 Test runner crashed:', error);
    process.exit(1);
  });
}

module.exports = TestRunner;