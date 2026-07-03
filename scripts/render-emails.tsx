import { createElement } from 'react'
import { renderEmail, Welcome, SessionRecap, CalibrationReminder, Streak, PasswordReset } from '../src/emails'

const templates = { Welcome, SessionRecap, CalibrationReminder, Streak, PasswordReset }

async function main() {
  for (const [name, Tpl] of Object.entries(templates)) {
    const html = await renderEmail(createElement(Tpl as () => JSX.Element))
    const ok = html.includes('SmartSound') && html.length > 400
    console.log(`${ok ? 'OK ' : 'BAD'} ${name.padEnd(20)} ${html.length} bytes`)
    if (!ok) process.exitCode = 1
  }
}

void main()
