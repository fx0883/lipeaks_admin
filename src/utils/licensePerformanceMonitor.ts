/**
 * 许可证更新性能监控工具
 * 基于temp0930文档的性能监控指南实现
 */

export interface PerformanceMetric {
  operation: string;
  duration: number;
  timestamp: string;
  metadata: Record<string, any>;
}

export interface PerformanceSummary {
  [operation: string]: {
    totalCalls: number;
    successCount: number;
    errorCount: number;
    averageDuration: string;
    minDuration: string;
    maxDuration: string;
  };
}

export interface MonitoringConfig {
  warningThreshold: number; // 警告阈值（毫秒）
  errorThreshold: number; // 错误阈值（毫秒）
  maxMetrics: number; // 最大存储的指标数量
  enableConsoleOutput: boolean; // 是否启用控制台输出
}

export class LicenseUpdatePerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private isMonitoring = false;
  private config: MonitoringConfig = {
    warningThreshold: 3000, // 3秒
    errorThreshold: 10000, // 10秒
    maxMetrics: 1000,
    enableConsoleOutput: true
  };

  constructor(config?: Partial<MonitoringConfig>) {
    if (config) {
      this.config = { ...this.config, ...config };
    }
  }

  startMonitoring(): void {
    this.isMonitoring = true;
    if (this.config.enableConsoleOutput) {
      console.log('许可证性能监控已启动');
    }
  }

  stopMonitoring(): void {
    this.isMonitoring = false;
    if (this.config.enableConsoleOutput) {
      console.log('许可证性能监控已停止');
    }
  }

  recordMetric(
    operation: string,
    startTime: number,
    endTime: number,
    metadata: Record<string, any> = {}
  ): PerformanceMetric {
    if (!this.isMonitoring) return {} as PerformanceMetric;

    const duration = endTime - startTime;
    const metric: PerformanceMetric = {
      operation,
      duration,
      timestamp: new Date().toISOString(),
      metadata
    };

    this.metrics.push(metric);

    // 限制存储的指标数量
    if (this.metrics.length > this.config.maxMetrics) {
      this.metrics = this.metrics.slice(-this.config.maxMetrics);
    }

    // 性能警告
    if (this.config.enableConsoleOutput) {
      if (duration > this.config.errorThreshold) {
        console.error(`🚨 性能严重警告: ${operation} 耗时 ${duration.toFixed(2)}ms`, metadata);
      } else if (duration > this.config.warningThreshold) {
        console.warn(`⚠️ 性能警告: ${operation} 耗时 ${duration.toFixed(2)}ms`, metadata);
      } else {
        console.debug(`✅ 性能正常: ${operation} 耗时 ${duration.toFixed(2)}ms`);
      }
    }

    return metric;
  }

  wrapApiCall<T extends (...args: any[]) => Promise<any>>(
    apiFunction: T,
    operationName: string
  ): T {
    return ((...args: Parameters<T>): ReturnType<T> => {
      if (!this.isMonitoring) {
        return apiFunction(...args);
      }

      const startTime = performance.now();

      return apiFunction(...args)
        .then((result: any) => {
          const endTime = performance.now();

          this.recordMetric(operationName, startTime, endTime, {
            status: 'success',
            args: args.length,
            hasResult: !!result
          });

          return result;
        })
        .catch((error: any) => {
          const endTime = performance.now();

          this.recordMetric(operationName, startTime, endTime, {
            status: 'error',
            error: error.message,
            args: args.length
          });

          throw error;
        });
    }) as T;
  }

  wrapFormOperation<T extends (...args: any[]) => any>(
    operation: T,
    operationName: string
  ): T {
    return ((...args: Parameters<T>): ReturnType<T> => {
      if (!this.isMonitoring) {
        return operation(...args);
      }

      const startTime = performance.now();

      try {
        const result = operation(...args);

        // 如果是Promise，包装它
        if (result && typeof result.then === 'function') {
          return result
            .then((res: any) => {
              const endTime = performance.now();
              this.recordMetric(operationName, startTime, endTime, {
                status: 'success',
                type: 'async'
              });
              return res;
            })
            .catch((error: any) => {
              const endTime = performance.now();
              this.recordMetric(operationName, startTime, endTime, {
                status: 'error',
                type: 'async',
                error: error.message
              });
              throw error;
            });
        } else {
          // 同步操作
          const endTime = performance.now();
          this.recordMetric(operationName, startTime, endTime, {
            status: 'success',
            type: 'sync'
          });
          return result;
        }
      } catch (error) {
        const endTime = performance.now();
        this.recordMetric(operationName, startTime, endTime, {
          status: 'error',
          type: 'sync',
          error: (error as Error).message
        });
        throw error;
      }
    }) as T;
  }

  getMetricsSummary(): PerformanceSummary {
    if (this.metrics.length === 0) {
      return {};
    }

    const operationGroups: { [key: string]: PerformanceMetric[] } = {};

    this.metrics.forEach(metric => {
      if (!operationGroups[metric.operation]) {
        operationGroups[metric.operation] = [];
      }
      operationGroups[metric.operation].push(metric);
    });

    const summary: PerformanceSummary = {};

    Object.keys(operationGroups).forEach(operation => {
      const metrics = operationGroups[operation];
      const durations = metrics.map(m => m.duration);
      const successCount = metrics.filter(m => m.metadata.status === 'success').length;

      summary[operation] = {
        totalCalls: metrics.length,
        successCount,
        errorCount: metrics.length - successCount,
        averageDuration: (durations.reduce((a, b) => a + b, 0) / durations.length).toFixed(2),
        minDuration: Math.min(...durations).toFixed(2),
        maxDuration: Math.max(...durations).toFixed(2)
      };
    });

    return summary;
  }

  getDetailedReport(): {
    summary: PerformanceSummary;
    rawMetrics: PerformanceMetric[];
    exportTime: string;
    config: MonitoringConfig;
  } {
    return {
      summary: this.getMetricsSummary(),
      rawMetrics: [...this.metrics],
      exportTime: new Date().toISOString(),
      config: { ...this.config }
    };
  }

  exportMetrics(): string {
    return JSON.stringify(this.getDetailedReport(), null, 2);
  }

  clearMetrics(): void {
    this.metrics = [];
    if (this.config.enableConsoleOutput) {
      console.log('性能监控数据已清空');
    }
  }

  printSummary(): void {
    const summary = this.getMetricsSummary();

    console.group('📊 许可证更新性能报告');
    console.log('监控状态:', this.isMonitoring ? '✅ 启用' : '❌ 禁用');
    console.log('总指标数量:', this.metrics.length);
    console.log('配置:', this.config);

    Object.entries(summary).forEach(([operation, stats]) => {
      console.group(`🔹 ${operation}`);
      console.log(`总调用次数: ${stats.totalCalls}`);
      console.log(`成功次数: ${stats.successCount}`);
      console.log(`失败次数: ${stats.errorCount}`);
      console.log(`平均耗时: ${stats.averageDuration}ms`);
      console.log(`最短耗时: ${stats.minDuration}ms`);
      console.log(`最长耗时: ${stats.maxDuration}ms`);
      console.groupEnd();
    });

    console.groupEnd();
  }

  // 生成性能报告的HTML格式
  generateHTMLReport(): string {
    const summary = this.getMetricsSummary();
    const reportTime = new Date().toLocaleString();

    let html = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>许可证更新性能报告</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 20px; }
        .header { background: #f5f5f5; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
        .metric-card { border: 1px solid #ddd; border-radius: 8px; padding: 15px; margin: 10px 0; }
        .metric-title { font-size: 18px; font-weight: bold; color: #333; }
        .metric-stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 10px; margin-top: 10px; }
        .stat-item { background: #f9f9f9; padding: 8px; border-radius: 4px; text-align: center; }
        .stat-value { font-size: 20px; font-weight: bold; color: #2196F3; }
        .stat-label { font-size: 12px; color: #666; margin-top: 4px; }
        .success { color: #4CAF50; }
        .error { color: #F44336; }
        .warning { color: #FF9800; }
    </style>
</head>
<body>
    <div class="header">
        <h1>许可证更新性能报告</h1>
        <p>生成时间: ${reportTime}</p>
        <p>监控状态: ${this.isMonitoring ? '<span class="success">✅ 启用</span>' : '<span class="error">❌ 禁用</span>'}</p>
        <p>总指标数量: ${this.metrics.length}</p>
    </div>`;

    Object.entries(summary).forEach(([operation, stats]) => {
      const successRate = ((stats.successCount / stats.totalCalls) * 100).toFixed(1);
      const statusClass = stats.errorCount > 0 ? 'warning' : 'success';

      html += `
    <div class="metric-card">
        <div class="metric-title">${operation}</div>
        <div class="metric-stats">
            <div class="stat-item">
                <div class="stat-value">${stats.totalCalls}</div>
                <div class="stat-label">总调用</div>
            </div>
            <div class="stat-item">
                <div class="stat-value ${statusClass}">${successRate}%</div>
                <div class="stat-label">成功率</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${stats.averageDuration}ms</div>
                <div class="stat-label">平均耗时</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${stats.minDuration}ms</div>
                <div class="stat-label">最短耗时</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${stats.maxDuration}ms</div>
                <div class="stat-label">最长耗时</div>
            </div>
        </div>
    </div>`;
    });

    html += `
</body>
</html>`;

    return html;
  }

  // 将HTML报告下载为文件
  downloadHTMLReport(filename = 'license-performance-report.html'): void {
    const html = this.generateHTMLReport();
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    URL.revokeObjectURL(url);

    if (this.config.enableConsoleOutput) {
      console.log(`性能报告已下载: ${filename}`);
    }
  }
}

// 创建默认实例
export const defaultLicensePerformanceMonitor = new LicenseUpdatePerformanceMonitor();

// 在开发环境下将监控工具挂载到全局对象
if (process.env.NODE_ENV === 'development') {
  (window as any).licensePerformanceMonitor = defaultLicensePerformanceMonitor;
  console.log('许可证性能监控工具已加载，使用 window.licensePerformanceMonitor 访问');
}
