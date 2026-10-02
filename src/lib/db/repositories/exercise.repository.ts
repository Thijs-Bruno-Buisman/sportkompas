import { BaseRepository } from "./base.repository";
import { type Exercise, type ExerciseMeasurementType } from "@/types/database";
import { ExerciseSchema } from "../schema";
import { type Table } from "dexie";
import { DEFAULT_EXERCISES } from "@/domain/strength/defaultExercises";

export interface ExerciseFilterOptions {
  query?: string;
  muscleGroup?: Exercise["primaryMuscleGroup"] | "alle";
  equipment?: Exercise["equipment"] | "alle";
  measurementType?: ExerciseMeasurementType | "alle";
  isCustom?: boolean;
  includeArchived?: boolean;
}

export class ExerciseRepository extends BaseRepository<Exercise> {
  constructor(table: Table<Exercise, string>) {
    super(table, ExerciseSchema);
  }

  /**
   * Zorgt ervoor dat de standaard oefeningen aanwezig zijn in de database.
   * Wordt veilig aangeroepen bij eerste initialisatie of lege bibliotheek.
   */
  async ensureDefaultExercises(
    defaultList: Exercise[] = DEFAULT_EXERCISES
  ): Promise<number> {
    const count = await this.table.count();
    if (count === 0) {
      const validated = defaultList.map((item) => this.validate(item));
      await this.table.bulkPut(validated);
      return validated.length;
    }
    return 0;
  }

  /**
   * Haalt alle oefeningen op, standaard met uitsluiting van gearchiveerde items.
   */
  async getAll(includeArchived = false): Promise<Exercise[]> {
    const all = await this.table.toArray();
    if (includeArchived) {
      return all;
    }
    return all.filter((ex) => !ex.isArchived);
  }

  /**
   * Zoekt en filtert oefeningen op basis van diverse criteria.
   * Ondersteunt meertalig/synoniem zoeken, spiergroep, materiaal, meettype en archivering.
   */
  async searchAndFilter(options: ExerciseFilterOptions = {}): Promise<Exercise[]> {
    const {
      query = "",
      muscleGroup = "alle",
      equipment = "alle",
      measurementType = "alle",
      isCustom,
      includeArchived = false,
    } = options;

    const q = query.toLowerCase().trim();

    return await this.table
      .filter((ex) => {
        // 1. Archief filter
        if (!includeArchived && ex.isArchived) {
          return false;
        }

        // 2. Eigen vs standaard filter (indien expliciet opgegeven)
        if (isCustom !== undefined && ex.isCustom !== isCustom) {
          return false;
        }

        // 3. Spiergroep filter (controleert primair en secundair)
        if (muscleGroup !== "alle") {
          const matchPrimary = ex.primaryMuscleGroup === muscleGroup;
          const matchSecondary = ex.secondaryMuscleGroups?.includes(
            muscleGroup as Exercise["primaryMuscleGroup"]
          );
          if (!matchPrimary && !matchSecondary) {
            return false;
          }
        }

        // 4. Apparatuur filter
        if (equipment !== "alle" && ex.equipment !== equipment) {
          return false;
        }

        // 5. Meettype filter
        if (
          measurementType !== "alle" &&
          ex.measurementType !== measurementType
        ) {
          return false;
        }

        // 6. Zoekopdracht (naam, synoniemen, spiergroep, apparatuur)
        if (q) {
          const nameMatch = ex.name.toLowerCase().includes(q);
          const aliasMatch = ex.alternativeNames?.some((alias) =>
            alias.toLowerCase().includes(q)
          );
          const muscleMatch = ex.primaryMuscleGroup.toLowerCase().includes(q);
          const equipMatch = ex.equipment.toLowerCase().includes(q);

          if (!nameMatch && !aliasMatch && !muscleMatch && !equipMatch) {
            return false;
          }
        }

        return true;
      })
      .toArray();
  }

  /**
   * Archiveert een oefening veilig zonder de referentie of historie van eerdere workouts te verliezen.
   */
  async archiveExercise(id: string): Promise<Exercise> {
    const exercise = await this.getById(id);
    if (!exercise) {
      throw new Error(`Oefening met ID ${id} is niet gevonden.`);
    }

    const updated: Exercise = {
      ...exercise,
      isArchived: true,
      updatedAt: new Date().toISOString(),
    };

    return await this.save(updated);
  }

  /**
   * Slaat een oefening op en stempelt updatedAt automatisch.
   */
  override async save(exercise: Exercise): Promise<Exercise> {
    const toSave: Exercise = {
      ...exercise,
      updatedAt: exercise.updatedAt || new Date().toISOString(),
    };
    return await super.save(toSave);
  }

  /**
   * Dearchiveert / herstelt een oefening zodat deze weer zichtbaar is in actieve selectielijsten.
   */
  async unarchiveExercise(id: string): Promise<Exercise> {
    const exercise = await this.getById(id);
    if (!exercise) {
      throw new Error(`Oefening met ID ${id} is niet gevonden.`);
    }

    const updated: Exercise = {
      ...exercise,
      isArchived: false,
      updatedAt: new Date().toISOString(),
    };

    return await this.save(updated);
  }

  /**
   * Haalt oefeningen op van een specifieke spiergroep.
   */
  async getByMuscleGroup(
    muscleGroup: Exercise["primaryMuscleGroup"],
    includeArchived = false
  ): Promise<Exercise[]> {
    return await this.searchAndFilter({
      muscleGroup,
      includeArchived,
    });
  }

  /**
   * Haalt oefeningen op van een specifieke categorie.
   */
  async getByCategory(
    category: Exercise["category"],
    includeArchived = false
  ): Promise<Exercise[]> {
    const list = await this.table.where("category").equals(category).toArray();
    if (includeArchived) return list;
    return list.filter((ex) => !ex.isArchived);
  }
}
