import { DataSource } from "typeorm";
import { Plainte } from "./src/Entity/plainte.entity";
import { CategoriePlainte } from "./src/Entity/categorie.entity";
import { Marin } from "./src/Entity/marin.entity";
import { User } from "./src/users/entities/user.entity";
import { Admin } from "./src/Entity/admin.entity";

export default new DataSource({
    type: "mysql",
    host: "localhost",
    port: 3306,
    username: "root",
    password: "",
    database: "GestionMarin",
    synchronize: false,
    logging: true,
    entities: [Plainte, CategoriePlainte, Marin, User, Admin],
    migrations: ["src/migrations/*.ts"],
    subscribers: [],
}); 