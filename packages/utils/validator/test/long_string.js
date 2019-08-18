const { expect } = require("chai");
const { longString } = require("../index");

describe("Valid medium strings", () => {
  const validLongString =
    "Vulpes bengalensis is a relatively small fox with an elongated muzzle, long, pointed ears, and a bushy tail about 50 to 60% of the length of the head and body.";
  it("should not contain errors if the password is formatted correctly", () => {
    const response = longString(validLongString);
    expect(response.errors).to.be.empty;
  });
});

describe("Invalid medium strings", () => {
  const invalidLongString =
    "Vulpes bengalensis is a relatively small fox with an elongated muzzle, long, pointed ears, and a bushy tail about 50 to 60% of the length of the head and body. Its dorsal pelage is very variable, but mostly grayish and paler ventrally; its legs tend to be brownish or rufous. It is more daintily built than Vulpes vulpes.[6] The tail is bushy with a prominent black tip which distinguishes it from V. vulpes. Back of ears are dark brown with black margin. Its rhinarium is naked and the lips are black, with small black hair patches on upper part of nuzzle (shaft) in front of eyes. The ears have the same colour as the nape or maybe darker, but not having a dark patch as in V. vulpes. Extensive variation in coat colour exists across populations and seasonally within populations, but generally varies from grey to pale brown. The head and body length is 18 in (46 cm), with a 10 in (25 cm) long tail. Typical weight is 5 to 9 pounds (2.3 to 4.1 kg). The genus Vulpes can be separated from Canis and Cuon in the Indian region by the flat forehead between the postorbital processes and not inflated by air cells.The processes themselves are slightly concave with a raised anterior edge(convexly round in other canids).The canine teeth are longer.";

  it("should contain one error if the string is too long", () => {
    const response = longString(invalidLongString);
    expect(response.errors).to.have.lengthOf(1);
  });
});
