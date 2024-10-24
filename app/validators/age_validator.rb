class AgeValidator < ActiveModel::Validator
  def validate(record)
    record.get_age
    if record.age < 18
      record.errors.add :date_of_birth, ": 18歳未満はご利用できません"
    end
  end
end
