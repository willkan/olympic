import {Command, flags} from '@oclif/command'
import * as fs from 'fs-extra'
import * as path from 'path'
import {spawn, execSync} from 'child_process'

export default class Create extends Command {
  static description = 'create project with the olympic-starter'

  static examples = [
    `$ olympic-cli create [project]
`,
  ]

  static flags = {
    help: flags.help({char: 'h'}),
  }

  static args = [{name: 'project', required: true}]

  async run() {
    const {args, flags} = this.parse(Create)
    const project = args.project
    this.log(`start to create olympic project [${project}] `)
    const projectDir = path.join(process.cwd(), project)
    this.log(`copying tpl to target(${projectDir})`)
    fs.copySync(path.join(__dirname, "..", "..", "src", "resource", "default-tpl"), projectDir, {recursive: true})
    this.log(`updating package.json`)
    const packageJsonFile = path.join(projectDir, "package.json")
    const packageObj = fs.readJsonSync(packageJsonFile) as any
    packageObj.project = project
    fs.writeJsonSync(packageJsonFile, packageObj)
    this.log(`installing dependencies`)
    let npm = 'cnpm'
    try {
      execSync("which cnpm")
      this.log('use cnpm')
    } catch (e) {
      npm = 'npm'
      this.log('use npm')
    }
    spawn(npm, ['install'], {cwd: projectDir, stdio:  [process.stdin, process.stdout, process.stderr]})
  }
}
