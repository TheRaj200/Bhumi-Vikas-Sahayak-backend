// Every CaseInputs path from docs/API_CONTRACT.md with labels and the clarification question (F5).
// Engine, validation, missing-input prompts and the encoded-rule schema all use this one list.

export const INPUT_FIELDS = {
  plot_area_sqm: { type: 'number', unit: 'sqm', label_en: 'Plot area', label_hi: 'प्लॉट क्षेत्रफल', question_en: 'What is the plot area in square metres?', question_hi: 'प्लॉट का क्षेत्रफल कितने वर्ग मीटर है?' },
  plot_width_m: { type: 'number', unit: 'm', label_en: 'Plot width (frontage)', label_hi: 'प्लॉट की चौड़ाई (फ्रंटेज)', question_en: 'How wide is the plot along the road (frontage) in metres?', question_hi: 'सड़क की ओर प्लॉट की चौड़ाई (फ्रंटेज) कितने मीटर है?' },
  plot_depth_m: { type: 'number', unit: 'm', label_en: 'Plot depth', label_hi: 'प्लॉट की गहराई', question_en: 'What is the plot depth in metres?', question_hi: 'प्लॉट की गहराई कितने मीटर है?' },
  road_width_m: { type: 'number', unit: 'm', label_en: 'Road width', label_hi: 'सड़क की चौड़ाई', question_en: 'How wide is the road the plot faces, in metres?', question_hi: 'प्लॉट के सामने की सड़क कितने मीटर चौड़ी है?' },
  road_facing_side: { type: 'enum', label_en: 'Road-facing side', label_hi: 'सड़क की ओर वाली दिशा', question_en: 'Which side of the plot faces the road?', question_hi: 'प्लॉट की कौन सी दिशा सड़क की ओर है?' },
  additional_road_widths_m: { type: 'number[]', unit: 'm', label_en: 'Other abutting road widths', label_hi: 'अन्य लगी हुई सड़कों की चौड़ाई', question_en: 'Does the plot touch any other road? If yes, how wide?', question_hi: 'क्या प्लॉट किसी और सड़क से लगा है? यदि हाँ, तो कितनी चौड़ी?' },
  land_use_zone: { type: 'enum', label_en: 'Land-use zone', label_hi: 'भूमि उपयोग ज़ोन', question_en: 'What is the land-use zone of the plot in the Development Plan?', question_hi: 'विकास योजना में प्लॉट का भूमि उपयोग ज़ोन क्या है?' },
  building_type: { type: 'enum', label_en: 'Building type / use', label_hi: 'भवन का प्रकार / उपयोग', question_en: 'What will the building be used for?', question_hi: 'भवन का उपयोग किस लिए होगा?' },
  building_form: { type: 'enum', label_en: 'Building form', label_hi: 'भवन का स्वरूप', question_en: 'Is the building detached, semi-detached or row-type?', question_hi: 'भवन स्वतंत्र, अर्ध-स्वतंत्र या रो-टाइप है?' },
  commercial_category: { type: 'enum', label_en: 'Commercial centre category', label_hi: 'वाणिज्यिक केंद्र श्रेणी', question_en: 'Which commercial centre category does the plot fall in?', question_hi: 'प्लॉट किस वाणिज्यिक केंद्र श्रेणी में आता है?' },
  planning_area_population: { type: 'enum', label_en: 'Planning-area population', label_hi: 'नियोजन क्षेत्र की जनसंख्या', question_en: 'What is the population of the planning area?', question_hi: 'नियोजन क्षेत्र की जनसंख्या कितनी है?' },
  application_type: { type: 'enum', label_en: 'Application type', label_hi: 'आवेदन का प्रकार', question_en: 'Is this an application for building permission or development permission?', question_hi: 'यह भवन अनुज्ञा का आवेदन है या विकास अनुज्ञा का?' },
  in_existing_developed_area: { type: 'boolean', label_en: 'In an existing developed area', label_hi: 'पहले से विकसित क्षेत्र में', question_en: 'Is the plot in an existing developed area?', question_hi: 'क्या प्लॉट पहले से विकसित क्षेत्र में है?' },
  near_aerodrome: { type: 'boolean', label_en: 'Near an aerodrome', label_hi: 'हवाई अड्डे के पास', question_en: 'Is the plot in the vicinity of an aerodrome?', question_hi: 'क्या प्लॉट हवाई अड्डे के आसपास है?' },

  'proposed.building_height_m': { type: 'number', unit: 'm', label_en: 'Building height', label_hi: 'भवन की ऊँचाई', question_en: 'What is the proposed building height in metres?', question_hi: 'प्रस्तावित भवन की ऊँचाई कितने मीटर है?' },
  'proposed.floors': { type: 'number', unit: 'count', label_en: 'Number of floors', label_hi: 'मंज़िलों की संख्या', question_en: 'How many floors (storeys) are proposed?', question_hi: 'कितनी मंज़िलें प्रस्तावित हैं?' },
  'proposed.footprint_width_m': { type: 'number', unit: 'm', label_en: 'Building footprint width', label_hi: 'भवन फुटप्रिंट की चौड़ाई', question_en: 'How wide is the building footprint (along the road) in metres?', question_hi: 'भवन का फुटप्रिंट (सड़क की ओर) कितने मीटर चौड़ा है?' },
  'proposed.footprint_depth_m': { type: 'number', unit: 'm', label_en: 'Building footprint depth', label_hi: 'भवन फुटप्रिंट की गहराई', question_en: 'How deep is the building footprint in metres?', question_hi: 'भवन का फुटप्रिंट कितने मीटर गहरा है?' },
  'proposed.front_setback_m': { type: 'number', unit: 'm', label_en: 'Front open space', label_hi: 'सामने की खुली जगह', question_en: 'How much open space is left at the front, in metres?', question_hi: 'सामने कितने मीटर खुली जगह छोड़ी गई है?' },
  'proposed.rear_setback_m': { type: 'number', unit: 'm', label_en: 'Rear open space', label_hi: 'पीछे की खुली जगह', question_en: 'How much open space is left at the rear, in metres?', question_hi: 'पीछे कितने मीटर खुली जगह छोड़ी गई है?' },
  'proposed.side_setback_left_m': { type: 'number', unit: 'm', label_en: 'Left side open space', label_hi: 'बाईं ओर की खुली जगह', question_en: 'How much open space is left on the left side (seen from the road), in metres?', question_hi: 'बाईं ओर (सड़क से देखने पर) कितने मीटर खुली जगह है?' },
  'proposed.side_setback_right_m': { type: 'number', unit: 'm', label_en: 'Right side open space', label_hi: 'दाईं ओर की खुली जगह', question_en: 'How much open space is left on the right side (seen from the road), in metres?', question_hi: 'दाईं ओर (सड़क से देखने पर) कितने मीटर खुली जगह है?' },
  'proposed.total_built_up_area_sqm': { type: 'number', unit: 'sqm', label_en: 'Total built-up area', label_hi: 'कुल निर्मित क्षेत्रफल', question_en: 'What is the total proposed built-up area (all floors) in square metres?', question_hi: 'कुल प्रस्तावित निर्मित क्षेत्रफल (सभी मंज़िलें) कितने वर्ग मीटर है?' },
  'proposed.entrance_width_m': { type: 'number', unit: 'm', label_en: 'Main entrance width', label_hi: 'मुख्य प्रवेश द्वार की चौड़ाई', question_en: 'How wide is the main entrance to the plot, in metres?', question_hi: 'प्लॉट का मुख्य प्रवेश द्वार कितने मीटर चौड़ा है?' },
  'proposed.has_lift': { type: 'boolean', label_en: 'Lift provided', label_hi: 'लिफ्ट का प्रावधान', question_en: 'Is a lift provided?', question_hi: 'क्या लिफ्ट का प्रावधान है?' },
  'proposed.live_trees_count': { type: 'number', unit: 'count', label_en: 'Live trees on plot', label_hi: 'प्लॉट पर जीवित पेड़', question_en: 'How many live trees are on the plot?', question_hi: 'प्लॉट पर कितने जीवित पेड़ हैं?' },
  'proposed.gift_shop_area_sqm': { type: 'number', unit: 'sqm', label_en: 'Gift shop area', label_hi: 'गिफ्ट शॉप क्षेत्रफल', question_en: 'What is the gift shop area in square metres?', question_hi: 'गिफ्ट शॉप का क्षेत्रफल कितने वर्ग मीटर है?' },

  'electric_line.present': { type: 'boolean', label_en: 'Overhead electric line nearby', label_hi: 'पास में ऊपरी बिजली लाइन', question_en: 'Is there an overhead electric line near the building?', question_hi: 'क्या भवन के पास कोई ऊपरी बिजली लाइन है?' },
  'electric_line.voltage_class': { type: 'enum', label_en: 'Electric line voltage', label_hi: 'बिजली लाइन का वोल्टेज', question_en: 'What type of line is it (low/medium, high up to 33 kV, or extra high)?', question_hi: 'लाइन किस प्रकार की है (निम्न/मध्यम, 33 kV तक उच्च, या अति उच्च)?' },
  'electric_line.vertical_clearance_m': { type: 'number', unit: 'm', label_en: 'Vertical clearance to line', label_hi: 'लाइन से ऊर्ध्वाधर दूरी', question_en: 'What is the vertical distance between the building and the line, in metres?', question_hi: 'भवन और लाइन के बीच ऊर्ध्वाधर दूरी कितने मीटर है?' },
  'electric_line.horizontal_clearance_m': { type: 'number', unit: 'm', label_en: 'Horizontal clearance to line', label_hi: 'लाइन से क्षैतिज दूरी', question_en: 'What is the horizontal distance between the building and the line, in metres?', question_hi: 'भवन और लाइन के बीच क्षैतिज दूरी कितने मीटर है?' },

  'permission.type': { type: 'enum', label_en: 'Granted permission type', label_hi: 'स्वीकृत अनुज्ञा का प्रकार', question_en: 'Is the granted permission a development permission or a building permission?', question_hi: 'स्वीकृत अनुज्ञा विकास अनुज्ञा है या भवन अनुज्ञा?' },
  'permission.granted_on': { type: 'date', label_en: 'Permission granted on', label_hi: 'अनुज्ञा स्वीकृति तिथि', question_en: 'On what date was the permission granted?', question_hi: 'अनुज्ञा किस तिथि को स्वीकृत हुई?' },
  'permission.execution_started': { type: 'boolean', label_en: 'Execution started during validity', label_hi: 'वैधता के दौरान निर्माण शुरू', question_en: 'Did execution of the project begin while the permission was valid?', question_hi: 'क्या अनुज्ञा की वैधता के दौरान निर्माण शुरू हुआ?' },
  'permission.as_of': { type: 'date', label_en: 'Evaluate validity as of', label_hi: 'इस तिथि पर वैधता', question_en: 'On which date should validity be checked?', question_hi: 'वैधता किस तिथि पर जाँची जाए?' },
};

// Derived values computed by src/engine/derived.js. `needs` lists the inputs each one depends on.
export const DERIVED_FIELDS = {
  'derived.frontage_m': { needs: ['plot_width_m'], unit: 'm', label_en: 'Frontage', label_hi: 'फ्रंटेज' },
  'derived.far_achieved': { needs: ['proposed.total_built_up_area_sqm', 'plot_area_sqm'], unit: 'ratio', label_en: 'FAR achieved', label_hi: 'प्राप्त FAR' },
  'derived.plot_area_hectare': { needs: ['plot_area_sqm'], unit: 'hectare', label_en: 'Plot area (hectare)', label_hi: 'प्लॉट क्षेत्रफल (हेक्टेयर)' },
  'derived.trees_per_hectare': { needs: ['proposed.live_trees_count', 'plot_area_sqm'], unit: 'count', label_en: 'Trees per hectare', label_hi: 'प्रति हेक्टेयर पेड़' },
  'derived.side_setback_min_m': { needs: ['proposed.side_setback_left_m', 'proposed.side_setback_right_m'], unit: 'm', label_en: 'Smaller side open space', label_hi: 'छोटी बगल की खुली जगह' },
  'derived.side_setback_max_m': { needs: ['proposed.side_setback_left_m', 'proposed.side_setback_right_m'], unit: 'm', label_en: 'Larger side open space', label_hi: 'बड़ी बगल की खुली जगह' },
  'derived.side_rear_min_m': { needs: ['proposed.rear_setback_m', 'proposed.side_setback_left_m', 'proposed.side_setback_right_m'], unit: 'm', label_en: 'Smallest side/rear open space', label_hi: 'सबसे छोटी बगल/पीछे की खुली जगह' },
  'derived.all_setbacks_min_m': { needs: ['proposed.front_setback_m', 'proposed.rear_setback_m', 'proposed.side_setback_left_m', 'proposed.side_setback_right_m'], unit: 'm', label_en: 'Smallest open space (all sides)', label_hi: 'सबसे छोटी खुली जगह (सभी ओर)' },
  'derived.ground_coverage_pct': { needs: ['proposed.footprint_width_m', 'proposed.footprint_depth_m', 'plot_area_sqm'], unit: 'percent', label_en: 'Ground coverage', label_hi: 'भू-आच्छादन' },
  'derived.max_road_width_m': { needs: ['road_width_m'], unit: 'm', label_en: 'Widest abutting road', label_hi: 'सबसे चौड़ी लगी सड़क' },
  // true if floors > 10 OR height > 30; false if height <= 30 AND floors <= 10; missing otherwise.
  'derived.is_high_rise': { needs: ['proposed.building_height_m', 'proposed.floors'], unit: null, label_en: 'High-rise building (Rule 2(38))', label_hi: 'उच्च भवन (नियम 2(38))' },
};

export const ALL_FIELD_PATHS = new Set([...Object.keys(INPUT_FIELDS), ...Object.keys(DERIVED_FIELDS)]);

export const ENUMS = {
  road_facing_side: ['north', 'south', 'east', 'west'],
  land_use_zone: ['residential', 'commercial', 'public_semi_public', 'industrial', 'agricultural', 'recreational', 'transportation'],
  building_type: ['residential', 'commercial', 'shop_cum_residence', 'public_semi_public', 'industrial', 'farm_house', 'agricultural_tourist_facility'],
  building_form: ['detached', 'semi_detached', 'row'],
  commercial_category: ['city_centre', 'sub_city_centre', 'community_centre', 'local_shopping_centre', 'convenience_shopping_centre'],
  planning_area_population: ['more_than_10_lakh', '5_to_10_lakh', 'less_than_5_lakh'],
  application_type: ['building_permission', 'development_permission'],
  voltage_class: ['low_medium_or_service', 'high_upto_33kv', 'extra_high_above_33kv'],
  permission_type: ['development', 'building'],
};
