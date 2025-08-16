import winston from 'winston'

export function createLogger(label: string) {
  return winston.createLogger({
    level: process.env.AWE_LOG_LEVEL || 'info',
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.label({ label }),
      winston.format.printf(({ timestamp, level, message, label }) => {
        return `${timestamp} [${label}] ${level}: ${message}`
      })
    ),
    transports: [
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.simple()
        )
      })
    ]
  })
}