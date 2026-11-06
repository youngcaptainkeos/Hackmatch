# HackMatch editable ERDPlus sources

- `HackMatch-ER.erdplus`: ER Diagram with the existing eight entities and eight relationships. The profile/opening references remain application-managed links to MongoDB, not SQL foreign keys.
- `HackMatch-Schema.erdplus`: Relational Schema with all six MySQL tables, their columns, primary keys, six foreign keys, unique flags and the composite application request key (Ugroup1).

Open https://erdplus.com/diagrams, click **Import**, select one `.erdplus` file and confirm **Import**. Repeat for the other file. Each creates a separate diagram with a distinct name; neither replaces the existing Hackmatch diagram.

These are editable native ERDPlus JSON files (current nodes/edges format). They are not SVG images or Mermaid files. ERDPlus uses its own native notation/layout. The conceptual model and SQL schema are preserved; the existing SVG and Mermaid diagram files are byte-for-byte unchanged.

ERDPlus's basic type palette is smaller than MySQL's. Exact `INT UNSIGNED`, `ENUM`, `BOOLEAN`, `DATETIME`, and `TIMESTAMP` declarations are stored as **Custom** types with their SQL declaration in the Size/custom text field. VARCHAR/CHAR lengths use their native size field. The generated captain key expression is described in the schema note. Full CHECK constraints, triggers, views, defaults, generated-column SQL and the procedure remain authoritative in `sql/schema.sql`; these modeling files do not replace an executable database migration.

Validation: JSON structure, unique node IDs, all relationship endpoints, all six foreign-key groups, exact SQL column lists, unique groups, and unchanged original-file SHA-256 hashes checked. The structure and custom-type fields were cross-checked against ERDPlus's published editor code and native export examples. Automated browser import was blocked by Chrome extension file-access settings, so an actual import round trip was not completed.
