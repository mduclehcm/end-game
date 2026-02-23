import { Controller, Get } from "@nestjs/common";

@Controller()
export class ChatController {
	@Get()
	async sayHello() {
		return "Hello World";
	}
}
